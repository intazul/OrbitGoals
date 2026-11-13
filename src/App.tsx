/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal, Habit, AppSettings, UserProfile, SecurityConfig, HabitTimeOfDay, TimeCapsule, ReversePenaltyRecord } from './types';
import { storage } from './utils/storage';
import { sound, triggerHaptic } from './utils/sound';
import { fireConfetti } from './utils/confetti';
import { notificationManager } from './utils/notifications';
import { APP_VERSION } from './utils/version';
import {
  calculateLevel,
  calculateLevelProgress,
  getRankInfo,
  calculateStreak,
  getCurrentWeekDays,
  XP_PER_HABIT,
  XP_PER_GOAL_STEP,
} from './utils/gamification';

import { AndroidFrame } from './components/AndroidFrame';
import { AddGoalScreen } from './components/AddGoalScreen';
import { GoalsScreen } from './components/GoalsScreen';
import { GoalCalendarScreen } from './components/GoalCalendarScreen';
import { AddHabitScreen } from './components/AddHabitScreen';
import { HabitsScreen } from './components/HabitsScreen';
import { HabitDetailScreen } from './components/HabitDetailScreen';
import { GoalDetailScreen } from './components/GoalDetailScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ScrapbookScreen } from './components/ScrapbookScreen';
import { LockScreen } from './components/LockScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { ToastContainer } from './components/ToastContainer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GoalIcon } from './components/GoalIcon';
import { ReverseZoneAuditModal } from './components/ReverseZoneAuditModal';
import { StepCounterModal } from './components/StepCounterModal';
import { StepAnalyticsScreen } from './components/StepAnalyticsScreen';
import { FocusTimerModal } from './components/FocusTimerModal';
import { usePedometer } from './hooks/usePedometer';
import { INITIAL_HABITS } from './utils/initialData';

import {
  Plus,
  Minus,
  Target,
  Settings,
  ListTodo,
  Calendar,
  Repeat,
  Flame,
  Sparkles,
  Check,
  Shield,
  ChevronRight,
  Camera,
  AlertTriangle,
  Clock,
  Footprints,
  Timer,
  Search,
  ArrowUpDown,
  X,
} from 'lucide-react';

export default function App() {
  const [goals, setGoals] = useState<Goal[]>(() => storage.getGoals());
  const [habits, setHabits] = useState<Habit[]>(() => storage.getHabits());
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [profile, setProfile] = useState<UserProfile>(() => storage.getProfile());
  const [security, setSecurity] = useState<SecurityConfig>(() => storage.getSecurity());
  const [capsules, setCapsules] = useState<TimeCapsule[]>(() => storage.getTimeCapsules());

  // First time opening: show onboarding if not onboarded yet
  const [isOnboarding, setIsOnboarding] = useState<boolean>(() => !storage.getProfile().onboarded);

  // App Lock on every launch: if onboarded and security is enabled, lock on startup
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const prof = storage.getProfile();
    const sec = storage.getSecurity();
    return prof.onboarded && sec.enabled;
  });

  const [isReplayingTour, setIsReplayingTour] = useState<boolean>(false);

  // Active Tab on Dashboard: 'habits' | 'goals'
  const [activeTab, setActiveTab] = useState<'habits' | 'goals'>('habits');
  const [habitFilter, setHabitFilter] = useState<'all' | HabitTimeOfDay>('all');

  // Screen View: 'dashboard' | 'goals' | 'habits' | 'add-goal' | 'add-habit' | 'calendar' | 'settings' | 'profile' | 'scrapbook' | 'habit-detail' | 'goal-detail' | 'pedometer'
  const [screenView, setScreenView] = useState<
    'dashboard' | 'goals' | 'habits' | 'add-goal' | 'add-habit' | 'calendar' | 'settings' | 'profile' | 'scrapbook' | 'habit-detail' | 'goal-detail' | 'pedometer'
  >('dashboard');
  const [calendarGoalId, setCalendarGoalId] = useState<string | undefined>(undefined);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<Habit | null>(null);
  const [selectedGoalForDetail, setSelectedGoalForDetail] = useState<Goal | null>(null);

  // Floating XP indicator state
  const [floatingXp, setFloatingXp] = useState<{ text: string; id: number } | null>(null);

  // Reverse Habit Zone State
  const [isReverseZone, setIsReverseZone] = useState<boolean>(() => storage.getReverseZoneActive());
  const [reverseHistory, setReverseHistory] = useState<ReversePenaltyRecord[]>(() => storage.getReverseHistory());
  const [showReverseAuditModal, setShowReverseAuditModal] = useState<boolean>(false);
  const [countdownToMidnight, setCountdownToMidnight] = useState<string>('');

  // Real-Time Steps Pedometer State & Enhanced Dashboard Controls
  const [showPedometerModal, setShowPedometerModal] = useState<boolean>(false);
  const [showFocusModal, setShowFocusModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<'default' | 'pending' | 'streak'>('default');
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const { state: pedometerState } = usePedometer();

  const todayStr = new Date().toISOString().split('T')[0];
  const weekDays = getCurrentWeekDays();

  // Apply Theme & Low Power Mode & Reverse Zone cleanly to root
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && mediaQuery.matches);

      if (isDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    if (settings.theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [settings.theme]);

  // Sync Reverse Zone state to storage
  useEffect(() => {
    storage.saveReverseZoneActive(isReverseZone);
  }, [isReverseZone]);

  // Live countdown to 11:59:59 PM today
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const diffMs = Math.max(0, endOfDay.getTime() - now.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setCountdownToMidnight(
        `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.lowPowerMode) {
      root.classList.add('low-power-mode');
    } else {
      root.classList.remove('low-power-mode');
    }
  }, [settings.lowPowerMode]);

  // Toggle Reverse Habit Zone
  const handleToggleReverseZone = () => {
    setIsReverseZone((prev) => {
      const next = !prev;
      sound.playPop();
      triggerHaptic('medium');
      storage.saveReverseZoneActive(next);
      updateSettings({ reverseZoneActive: next });
      if (next) {
        notificationManager.sendNotification(
          '🔥 Reverse Habit Zone Active',
          'Uncompleted habits will deduct XP at 11:59 PM. Complete them before midnight!',
          'habit'
        );
      } else {
        notificationManager.sendNotification(
          '🛡️ Safe Mode Active',
          'Reverse XP deductions are turned off. Missed habits will not deduct XP.',
          'milestone'
        );
      }
      return next;
    });
  };

  // Daily habit reset at 00:00 midnight with Reverse Habit 11:59 PM XP deduction
  useEffect(() => {
    const performMidnightReset = () => {
      const result = storage.checkAndResetDailyHabits();
      if (result.didReset) {
        setHabits(result.habits);
        const updatedProfile = storage.getProfile();
        setProfile(updatedProfile);
        setReverseHistory(storage.getReverseHistory());
        sound.playSuccessChime();

        if (result.xpDeducted > 0) {
          setFloatingXp({ text: `-${result.xpDeducted} XP (Missed Habits)`, id: Date.now() });
          setTimeout(() => setFloatingXp(null), 2500);
          notificationManager.sendNotification(
            '⚠️ Reverse Habit Zone Settlement',
            `11:59 PM passed: -${result.xpDeducted} XP was deducted for uncompleted habits.`,
            'milestone'
          );
        }
      }
    };

    // 1. Initial check when app mounts
    performMidnightReset();

    // 2. Schedule timeout to the next exact 00:00:01 midnight
    let midnightTimer: NodeJS.Timeout;
    const scheduleNextMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1
      );
      const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());

      midnightTimer = setTimeout(() => {
        performMidnightReset();
        scheduleNextMidnight(); // Schedule next day's 00:00
      }, msUntilMidnight);
    };

    scheduleNextMidnight();

    // 3. 60-second periodic heartbeat in case the device was asleep over midnight
    const heartbeat = setInterval(performMidnightReset, 60000);

    return () => {
      clearTimeout(midnightTimer);
      clearInterval(heartbeat);
    };
  }, []);

  // Periodic Push Notification & Scheduled Alert Reminder Checker
  useEffect(() => {
    notificationManager.checkScheduledReminders(habits, goals);
    const interval = setInterval(() => {
      notificationManager.checkScheduledReminders(habits, goals);
    }, 15000);
    return () => clearInterval(interval);
  }, [habits, goals]);

  // Auto-Lock monitoring effect: handles "Immediately" or configured minutes
  useEffect(() => {
    if (!profile.onboarded || !security.enabled) return;

    let lastInteractionTime = Date.now();

    const handleUserActivity = () => {
      lastInteractionTime = Date.now();
    };

    const handleVisibilityOrBlur = () => {
      if (document.visibilityState === 'hidden') {
        sessionStorage.setItem('orbitgoals_last_blur', String(Date.now()));
      } else if (document.visibilityState === 'visible') {
        const blurStr = sessionStorage.getItem('orbitgoals_last_blur');
        const blurTime = blurStr ? parseInt(blurStr, 10) : Date.now();
        const diffMs = Date.now() - blurTime;
        const autoLockMin = typeof security.autoLockMinutes === 'number' ? security.autoLockMinutes : 0;

        if (autoLockMin === 0) {
          // Immediately on switch or reopening
          setIsLocked(true);
        } else if (autoLockMin > 0) {
          const timeoutMs = autoLockMin * 60 * 1000;
          if (diffMs >= timeoutMs) {
            setIsLocked(true);
          }
        }
      }
    };

    // Periodic idle check while app stays open
    const interval = setInterval(() => {
      const autoLockMin = typeof security.autoLockMinutes === 'number' ? security.autoLockMinutes : 0;
      if (autoLockMin > 0) {
        const idleMs = Date.now() - lastInteractionTime;
        if (idleMs >= autoLockMin * 60 * 1000) {
          setIsLocked(true);
        }
      }
    }, 10000);

    window.addEventListener('pointerdown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    document.addEventListener('visibilitychange', handleVisibilityOrBlur);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
    };
  }, [profile.onboarded, security.enabled, security.autoLockMinutes]);

  // Persist Goals
  const updateGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    storage.saveGoals(newGoals);
  };

  // Persist Habits
  const updateHabits = (newHabits: Habit[]) => {
    setHabits(newHabits);
    storage.saveHabits(newHabits);
  };

  // Persist Settings
  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      storage.saveSettings(next);
      return next;
    });
  };

  // Persist Profile
  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      storage.saveProfile(next);
      return next;
    });
  };

  // Persist Security
  const handleUpdateSecurity = (updates: Partial<SecurityConfig>) => {
    setSecurity((prev) => {
      const next = { ...prev, ...updates };
      storage.saveSecurity(next);
      return next;
    });
  };

  // Award or Deduct XP with Leveling & Feedback
  const handleAdjustXp = (amount: number, reason: string) => {
    const currentXp = profile.xp || 0;
    const newXp = Math.max(0, currentXp + amount);
    const oldLevel = calculateLevel(currentXp);
    const newLevel = calculateLevel(newXp);

    if (amount > 0) {
      setFloatingXp({ text: `+${amount} XP`, id: Date.now() });
      setTimeout(() => setFloatingXp(null), 1400);
    }

    const updatedProfile: UserProfile = {
      ...profile,
      xp: newXp,
      level: newLevel,
      title: getRankInfo(newLevel).title,
    };

    handleUpdateProfile(updatedProfile);

    // Level-up celebration
    if (newLevel > oldLevel) {
      sound.playLevelUp();
      fireConfetti(3000);
      const rankInfo = getRankInfo(newLevel);
      notificationManager.sendNotification(
        `⭐ Level Up! Level ${newLevel}`,
        `You unlocked the title "${rankInfo.title}"! Keep going!`,
        'milestone'
      );
    }
  };

  // Handle first time onboarding completion
  const handleCompleteOnboarding = (newProfile: UserProfile, newSecurity: SecurityConfig) => {
    const initializedProfile: UserProfile = {
      ...newProfile,
      xp: typeof newProfile.xp === 'number' ? newProfile.xp : 0,
      level: typeof newProfile.level === 'number' ? newProfile.level : 1,
      title: getRankInfo(newProfile.level || 1).title,
      streakShields: 2,
    };

    storage.saveProfile(initializedProfile);
    storage.saveSecurity(newSecurity);
    setProfile(initializedProfile);
    setSecurity(newSecurity);
    setIsOnboarding(false);
    setIsReplayingTour(false);
    setIsLocked(false);

    notificationManager.sendNotification(
      `Welcome to OrbitGoals!`,
      `Hi ${newProfile.name}, your habits & goals are now ready to track.`,
      'milestone'
    );
  };

  // Toggle Habit completion for today (+10 XP or custom habit xpPerSet)
  const handleToggleHabit = (habitId: string) => {
    let wasChecked = false;
    let xpChange = 0;
    let habitTitle = '';
    let linkedGoalIdToSync: string | undefined;

    const newHabits = habits.map((habit) => {
      if (habit.id !== habitId) return habit;
      habitTitle = habit.title;
      linkedGoalIdToSync = habit.linkedGoalId;
      const target = habit.targetValue || 30;
      const setXp = habit.xpPerSet || (habit.unit === 'videos' ? 50 : XP_PER_HABIT);

      const isAlreadyCompleted = (habit.completedDates || []).includes(todayStr);
      wasChecked = !isAlreadyCompleted;

      let updatedDates = [...(habit.completedDates || [])];
      let todayProgress = typeof habit.todayProgress === 'number' ? habit.todayProgress : 0;

      if (wasChecked) {
        if (!updatedDates.includes(todayStr)) updatedDates.push(todayStr);
        todayProgress = Math.max(todayProgress, target);
        xpChange = setXp;
      } else {
        updatedDates = updatedDates.filter((d) => d !== todayStr);
        todayProgress = 0;
        xpChange = -setXp;
      }

      const progressHistory = { ...(habit.progressHistory || {}) };
      progressHistory[todayStr] = todayProgress;

      const streakDays = calculateStreak(updatedDates);
      const bestStreak = Math.max(habit.bestStreak || 0, streakDays);

      return {
        ...habit,
        todayProgress,
        progressHistory,
        completedDates: updatedDates,
        streakDays,
        bestStreak,
      };
    });

    updateHabits(newHabits);

    if (wasChecked) {
      sound.playPop();
      triggerHaptic('success');
      handleAdjustXp(xpChange, `${habitTitle} completed`);
      if (linkedGoalIdToSync) {
        handleUpdateGoalValue(linkedGoalIdToSync, 1);
      }
    } else {
      sound.playPop();
      triggerHaptic('light');
      handleAdjustXp(xpChange, `${habitTitle} uncompleted`);
      if (linkedGoalIdToSync) {
        handleUpdateGoalValue(linkedGoalIdToSync, -1);
      }
    }
  };

  // Log a set for a habit (e.g. +10 reps, or +1 video), synced with linked goal
  const handleLogHabitSet = (habitId: string, delta: number) => {
    let xpChange = 0;
    let habitTitle = '';
    let linkedGoalIdToSync: string | undefined;

    const newHabits = habits.map((habit) => {
      if (habit.id !== habitId) return habit;
      habitTitle = habit.title;
      linkedGoalIdToSync = habit.linkedGoalId;

      const target = habit.targetValue || 30;
      const setXp = habit.xpPerSet || (habit.unit === 'videos' ? 25 : XP_PER_HABIT);
      const currentProgress = typeof habit.todayProgress === 'number' ? habit.todayProgress : 0;
      const newProgress = Math.max(0, currentProgress + delta);

      xpChange = delta > 0 ? setXp : (currentProgress > 0 ? -setXp : 0);

      const progressHistory = { ...(habit.progressHistory || {}) };
      progressHistory[todayStr] = newProgress;

      let updatedDates = [...(habit.completedDates || [])];
      if (newProgress >= target) {
        if (!updatedDates.includes(todayStr)) updatedDates.push(todayStr);
      } else {
        updatedDates = updatedDates.filter((d) => d !== todayStr);
      }

      const streakDays = calculateStreak(updatedDates);
      const bestStreak = Math.max(habit.bestStreak || 0, streakDays);

      return {
        ...habit,
        todayProgress: newProgress,
        progressHistory,
        completedDates: updatedDates,
        streakDays,
        bestStreak,
      };
    });

    updateHabits(newHabits);

    if (xpChange !== 0) {
      sound.playPop();
      triggerHaptic('light');
      handleAdjustXp(xpChange, `${habitTitle} set logged`);
    }

    // Sync linked goal!
    if (linkedGoalIdToSync) {
      handleUpdateGoalValue(linkedGoalIdToSync, delta);
    }
  };

  // Settle today's pending uncompleted habits immediately (Manual Cutoff Audit)
  const handleSettleReversePenaltiesNow = () => {
    const result = storage.settleReverseHabitsNow(todayStr);
    if (result.xpDeducted > 0) {
      sound.playPop();
      triggerHaptic('medium');
      const updatedProfile = storage.getProfile();
      setProfile(updatedProfile);
      setReverseHistory(storage.getReverseHistory());
      setFloatingXp({ text: `-${result.xpDeducted} XP Penalty`, id: Date.now() });
      setTimeout(() => setFloatingXp(null), 2500);
      notificationManager.sendNotification(
        '⚠️ Reverse Habit Zone Settlement',
        `Manually settled cutoff: -${result.xpDeducted} XP deducted for ${result.penalties.length} uncompleted habit(s).`,
        'milestone'
      );
    } else {
      sound.playSuccessChime();
      triggerHaptic('success');
      alert('All habits are currently completed! No reverse penalties to deduct.');
    }
  };

  const handleClearReverseHistory = () => {
    storage.saveReverseHistory([]);
    setReverseHistory([]);
  };

  // Sync Real Steps from Pedometer to Habits & Goals
  const handleSyncStepsToHabits = (stepCount: number, silent: boolean = false) => {
    let matchedAny = false;
    let earnedXpTotal = 0;

    const updatedHabits = habits.map((h) => {
      const isStepsHabit =
        h.unit?.toLowerCase() === 'steps' ||
        h.title.toLowerCase().includes('step') ||
        h.title.toLowerCase().includes('walk') ||
        h.icon === 'steps' ||
        h.icon === 'walk';

      if (!isStepsHabit) return h;

      matchedAny = true;
      const target = h.targetValue || 10000;
      const prevProgress = typeof h.todayProgress === 'number' ? h.todayProgress : 0;
      const newProgress = Math.max(prevProgress, stepCount);
      const wasDone = (h.completedDates || []).includes(todayStr);
      const isNowDone = newProgress >= target;

      const completedDates = [...(h.completedDates || [])];
      let streakDays = h.streakDays || 0;
      let bestStreak = h.bestStreak || 0;

      if (isNowDone && !wasDone) {
        completedDates.push(todayStr);
        streakDays = calculateStreak(completedDates);
        bestStreak = Math.max(bestStreak, streakDays);
        earnedXpTotal += h.xpPerSet || XP_PER_HABIT;
      }

      const progressHistory = { ...(h.progressHistory || {}) };
      progressHistory[todayStr] = newProgress;

      return {
        ...h,
        todayProgress: newProgress,
        completedDates,
        streakDays,
        bestStreak,
        progressHistory,
      };
    });

    if (matchedAny) {
      updateHabits(updatedHabits);
      if (earnedXpTotal > 0) {
        handleAdjustXp(earnedXpTotal, '10,000 Steps Target Crushed');
        fireConfetti(2500);
        notificationManager.sendNotification(
          '👟 Step Target Crushed!',
          `You achieved your step target with ${stepCount.toLocaleString()} real steps!`,
          'streak'
        );
      }
    } else if (!silent) {
      notificationManager.sendNotification(
        '👟 Pedometer Step Counter',
        `${stepCount.toLocaleString()} real steps counted today!`,
        'habit'
      );
    }

    // Also sync to any step-related goal
    const updatedGoals = goals.map((g) => {
      const isStepGoal =
        g.unit?.toLowerCase() === 'steps' ||
        g.title.toLowerCase().includes('step') ||
        g.title.toLowerCase().includes('walk') ||
        g.icon === 'steps' ||
        g.icon === 'walk';

      if (!isStepGoal) return g;
      const newCurrent = Math.max(g.currentValue, stepCount);
      const isGoalCompleted = newCurrent >= g.targetValue;
      const completedDates = [...(g.completedDates || [])];
      if (isGoalCompleted && !completedDates.includes(todayStr)) {
        completedDates.push(todayStr);
      }
      return {
        ...g,
        currentValue: newCurrent,
        completedDates,
      };
    });
    updateGoals(updatedGoals);
  };

  // Real-time automatic background step sync into linked habits and goals
  useEffect(() => {
    if (pedometerState.stepsToday > 0) {
      handleSyncStepsToHabits(pedometerState.stepsToday, true);
    }
  }, [pedometerState.stepsToday]);

  // Save New or Edited Habit
  const handleSaveHabit = (
    habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streakDays' | 'bestStreak'>
  ) => {
    let targetHabit: Habit;
    if (editingHabit) {
      const updated = habits.map((h) =>
        h.id === editingHabit.id ? { ...h, ...habitData } : h
      );
      updateHabits(updated);
      targetHabit = updated.find((h) => h.id === editingHabit.id) || { ...editingHabit, ...habitData };
      setEditingHabit(undefined);
    } else {
      const newHabit: Habit = {
        ...habitData,
        id: `habit-${Date.now()}`,
        createdAt: todayStr,
        streakDays: 0,
        bestStreak: 0,
        completedDates: [],
        progressHistory: {},
      };
      updateHabits([newHabit, ...habits]);
      targetHabit = newHabit;
    }

    sound.playSuccessChime();
    triggerHaptic('success');
    setHabitFilter('all');
    // Open new tab showing full habit details
    setSelectedHabitForDetail(targetHabit);
    setScreenView('habit-detail');
  };

  // Restore starter daily habits
  const handleRestoreStarterHabits = () => {
    updateHabits(INITIAL_HABITS);
    setHabitFilter('all');
    sound.playSuccessChime();
    triggerHaptic('success');
  };

  // Delete Habit
  const handleDeleteHabit = (habitId: string) => {
    const newHabits = habits.filter((h) => h.id !== habitId);
    updateHabits(newHabits);
    sound.playPop();
    triggerHaptic('medium');
  };

  // Reset Individual Habit (today only or full reset)
  const handleResetHabit = (habitId: string, resetAllHistory: boolean = false) => {
    const updated = habits.map((h) => {
      if (h.id !== habitId) return h;
      if (resetAllHistory) {
        return {
          ...h,
          todayProgress: 0,
          streakDays: 0,
          bestStreak: 0,
          completedDates: [],
          progressHistory: {},
        };
      }
      return {
        ...h,
        todayProgress: 0,
        completedDates: (h.completedDates || []).filter((d) => d !== todayStr),
      };
    });
    updateHabits(updated);
    setSelectedHabitForDetail((prev) =>
      prev && prev.id === habitId ? updated.find((h) => h.id === habitId) || null : prev
    );
    sound.playPop();
    triggerHaptic('medium');
  };

  // Increment or Decrement Goal Value (dynamic XP per step from settings or goal)
  const handleUpdateGoalValue = (goalId: string, delta: number) => {
    let hitMilestone = false;
    let milestoneTitle = '';
    let goalXp = settings.goalXpPerStep || XP_PER_GOAL_STEP;

    const newGoals = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
      if (goal.xpReward) goalXp = goal.xpReward;
      const newVal = Math.max(0, goal.currentValue + delta);
      const wasCompleted = goal.currentValue >= goal.targetValue;
      const isNowCompleted = newVal >= goal.targetValue;

      if (!wasCompleted && isNowCompleted && delta > 0) {
        hitMilestone = true;
        milestoneTitle = goal.title;
      }

      const history = [...(goal.history || [])];
      const todayHistoryIdx = history.findIndex((h) => h.date === todayStr);
      if (todayHistoryIdx >= 0) {
        history[todayHistoryIdx].value = newVal;
      } else {
        history.push({ date: todayStr, value: newVal });
      }

      // Sync completedDates
      let updatedCompletedDates = [...(goal.completedDates || [])];
      if (isNowCompleted && !updatedCompletedDates.includes(todayStr)) {
        updatedCompletedDates.push(todayStr);
      } else if (!isNowCompleted && updatedCompletedDates.includes(todayStr)) {
        updatedCompletedDates = updatedCompletedDates.filter((d) => d !== todayStr);
      }

      return {
        ...goal,
        currentValue: newVal,
        completedDates: updatedCompletedDates,
        history,
      };
    });

    updateGoals(newGoals);

    if (delta > 0) {
      sound.playPop();
      triggerHaptic('light');
      handleAdjustXp(goalXp, 'Goal progress step');
    } else if (delta < 0) {
      sound.playPop();
      triggerHaptic('light');
      handleAdjustXp(-goalXp, 'Goal step reverted');
    }

    if (hitMilestone) {
      sound.playSuccessChime();
      fireConfetti(2500);
      notificationManager.sendNotification(
        `🎯 Goal Completed!`,
        `You reached 100% of ${milestoneTitle}!`,
        'milestone'
      );
    }
  };

  // Delete Goal
  const handleDeleteGoal = (goalId: string) => {
    const newGoals = goals.filter((g) => g.id !== goalId);
    updateGoals(newGoals);
    sound.playPop();
  };

  // Reset Individual Goal (current value to 0 or full history reset)
  const handleResetGoal = (goalId: string, resetAllHistory: boolean = false) => {
    const updated = goals.map((g) => {
      if (g.id !== goalId) return g;
      const history = resetAllHistory
        ? [{ date: todayStr, value: 0 }]
        : [...(g.history || []), { date: todayStr, value: 0 }];
      const subtasks = (g.subtasks || []).map((s) => ({ ...s, completed: false }));
      return {
        ...g,
        currentValue: 0,
        completedDates: (g.completedDates || []).filter((d) => d !== todayStr),
        history,
        subtasks,
      };
    });
    updateGoals(updated);
    setSelectedGoalForDetail((prev) =>
      prev && prev.id === goalId ? updated.find((g) => g.id === goalId) || null : prev
    );
    sound.playPop();
    triggerHaptic('medium');
  };

  // Quick inline update for Habit (e.g. reminder toggle)
  const handleUpdateHabit = (habitId: string, updates: Partial<Habit>) => {
    const updated = habits.map((h) => (h.id === habitId ? { ...h, ...updates } : h));
    updateHabits(updated);
    setSelectedHabitForDetail((prev) => (prev && prev.id === habitId ? { ...prev, ...updates } : prev));
  };

  // Quick inline update for Goal (e.g. reminder toggle)
  const handleUpdateGoal = (goalId: string, updates: Partial<Goal>) => {
    const updated = goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g));
    updateGoals(updated);
    setSelectedGoalForDetail((prev) => (prev && prev.id === goalId ? { ...prev, ...updates } : prev));
  };

  // Reset All Data
  const handleResetAllData = () => {
    if (confirm('Are you sure you want to delete all habits & goals and reset? This cannot be undone.')) {
      updateGoals([]);
      updateHabits([]);
      handleUpdateProfile({ xp: 0, level: 1, title: 'Novice Achiever' });
      sound.playPop();
      notificationManager.sendNotification('Reset Complete', 'All data has been cleared.', 'reminder');
      setScreenView('dashboard');
    }
  };

  // Restore complete backup data into React state smoothly
  const handleRestoreBackup = (data: {
    goals: Goal[];
    habits: Habit[];
    profile: UserProfile;
    settings: AppSettings;
    security: SecurityConfig;
  }) => {
    if (data.goals) setGoals(data.goals);
    if (data.habits) setHabits(data.habits);
    if (data.profile) setProfile(data.profile);
    if (data.settings) setSettings(data.settings);
    if (data.security) setSecurity(data.security);
    setCapsules(storage.getTimeCapsules());
  };

  // Add Time Capsule Memory
  const handleAddCapsule = (capsuleData: Omit<TimeCapsule, 'id' | 'createdAt'>) => {
    const newCapsule: TimeCapsule = {
      ...capsuleData,
      id: `capsule-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newCapsule, ...capsules];
    setCapsules(updated);
    storage.saveTimeCapsules(updated);
    handleAdjustXp(capsuleData.xpBonus || 100, `Milestone capsule: ${capsuleData.title}`);
    fireConfetti(2200);
    notificationManager.sendNotification(
      '📸 Milestone Saved!',
      `Added "${capsuleData.title}" to your Growth Scrapbook (+100 XP)`,
      'milestone'
    );
  };

  // Delete Time Capsule Memory
  const handleDeleteCapsule = (id: string) => {
    const updated = capsules.filter((c) => c.id !== id);
    setCapsules(updated);
    storage.saveTimeCapsules(updated);
    sound.playPop();
  };

  // Manual / On-Demand Daily Habit Reset
  const handleManualDailyHabitReset = () => {
    const updated = storage.resetDailyHabitsProgress();
    setHabits(updated);
    sound.playSuccessChime();
    triggerHaptic('success');
    notificationManager.sendNotification(
      '🌅 Daily Habits Reset',
      'All daily habit progress has been reset for today.',
      'milestone'
    );
  };

  // Save New or Edited Goal (with optional auto-created linked habit)
  const handleSaveGoal = (
    goalData: Omit<Goal, 'id' | 'createdAt' | 'completedDates' | 'history'>,
    autoCreateHabit?: boolean
  ) => {
    if (editingGoal) {
      const updatedGoals = goals.map((g) => {
        if (g.id !== editingGoal.id) return g;
        const history = [...(g.history || [])];
        const todayHistoryIdx = history.findIndex((h) => h.date === todayStr);
        if (todayHistoryIdx >= 0) {
          history[todayHistoryIdx].value = goalData.currentValue;
        } else {
          history.push({ date: todayStr, value: goalData.currentValue });
        }
        return {
          ...g,
          ...goalData,
          history,
        };
      });
      updateGoals(updatedGoals);
      const savedGoal = updatedGoals.find((g) => g.id === editingGoal.id) || { ...editingGoal, ...goalData };
      setEditingGoal(undefined);
      sound.playSuccessChime();
      triggerHaptic('success');
      setSelectedGoalForDetail(savedGoal);
      setScreenView('goal-detail');
      return;
    }

    const goalId = `goal-${Date.now()}`;
    const newGoal: Goal = {
      ...goalData,
      id: goalId,
      createdAt: todayStr,
      completedDates: [],
      history: [{ date: todayStr, value: goalData.currentValue }],
    };

    if (autoCreateHabit) {
      const isYouTube = goalData.icon === 'youtube' || goalData.category === 'creator';
      const isFitness = goalData.category === 'fitness';
      const habitId = `habit-${Date.now()}`;
      const newHabit: Habit = {
        id: habitId,
        title: isYouTube
          ? `Upload YouTube Video`
          : isFitness
          ? `Daily Exercise Sets`
          : `Daily ${goalData.title}`,
        description: `Connected to goal: ${goalData.title} (+50 XP)`,
        category: goalData.category,
        timeOfDay: 'anytime',
        frequency: 'daily',
        icon: goalData.icon,
        color: goalData.color,
        streakDays: 0,
        bestStreak: 0,
        completedDates: [],
        createdAt: todayStr,
        trackingType: 'sets',
        targetValue: isYouTube ? 1 : (isFitness ? 30 : Math.min(goalData.targetValue, 10)),
        unit: goalData.unit,
        stepValue: isYouTube ? 1 : (isFitness ? 10 : 1),
        xpPerSet: isYouTube ? 50 : (settings.habitXpPerSet || 10),
        todayProgress: 0,
        progressHistory: {},
        linkedGoalId: goalId,
        linkedGoalTitle: goalData.title,
      };
      newGoal.linkedHabitId = habitId;
      updateHabits([newHabit, ...habits]);
    }

    updateGoals([newGoal, ...goals]);
    sound.playSuccessChime();
    triggerHaptic('success');
    // Open new tab showing full goal details
    setSelectedGoalForDetail(newGoal);
    setScreenView('goal-detail');
  };

  const handleOpenCalendar = (goalId?: string) => {
    setCalendarGoalId(goalId);
    setScreenView('calendar');
    sound.playPop();
    triggerHaptic('light');
  };

  const handleToggleSubtask = (goalId: string, subtaskId: string) => {
    const updated = goals.map((g) => {
      if (g.id !== goalId) return g;
      const subtasks = (g.subtasks || []).map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      );
      return { ...g, subtasks };
    });
    updateGoals(updated);
    sound.playPop();
    triggerHaptic('light');
  };

  const formatFrequency = (goal: Goal) => {
    if (goal.frequency === 'long_term') return 'Long Term · Every Day';
    if (goal.frequency === 'weekly') {
      if (goal.frequencyDays && goal.frequencyDays.length > 0) {
        return `Weekly · ${goal.frequencyDays.join(', ')}`;
      }
      return 'Weekly';
    }
    if (goal.frequency === 'monthly') return 'Monthly';
    return 'Daily';
  };

  // Stats Calculations
  const completedGoalsCount = goals.filter((g) => (g.completedDates || []).includes(todayStr)).length;
  const totalGoals = goals.length;
  const goalsPct = totalGoals > 0 ? Math.round((completedGoalsCount / totalGoals) * 100) : 0;

  const completedHabitsCount = habits.filter((h) => (h.completedDates || []).includes(todayStr)).length;
  const totalHabits = habits.length;
  const habitsPct = totalHabits > 0 ? Math.round((completedHabitsCount / totalHabits) * 100) : 0;

  // Reverse Zone Metrics
  const uncompletedHabits = habits.filter((h) => !(h.completedDates || []).includes(todayStr));
  const potentialXpLoss = uncompletedHabits.reduce(
    (sum, h) => sum + (h.xpPerSet || XP_PER_HABIT),
    0
  );
  const securedXp = habits
    .filter((h) => (h.completedDates || []).includes(todayStr))
    .reduce((sum, h) => sum + (h.xpPerSet || XP_PER_HABIT), 0);

  // Filtered & sorted habits/goals for organized dashboard list
  const filteredHabits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = habits.filter((h) => {
      const matchesTime = habitFilter === 'all' || h.timeOfDay === habitFilter;
      const matchesSearch =
        !q || h.title.toLowerCase().includes(q) || (h.category && h.category.toLowerCase().includes(q));
      return matchesTime && matchesSearch;
    });

    if (sortMode === 'pending') {
      return [...list].sort((a, b) => {
        const aDone = (a.completedDates || []).includes(todayStr) ? 1 : 0;
        const bDone = (b.completedDates || []).includes(todayStr) ? 1 : 0;
        return aDone - bDone;
      });
    }
    if (sortMode === 'streak') {
      return [...list].sort((a, b) => (b.streakDays || 0) - (a.streakDays || 0));
    }
    return list;
  }, [habits, habitFilter, searchQuery, sortMode, todayStr]);

  const filteredGoals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = goals.filter(
      (g) => !q || g.title.toLowerCase().includes(q) || (g.category && g.category.toLowerCase().includes(q))
    );
    if (sortMode === 'pending') {
      return [...list].sort((a, b) => {
        const aPct = (a.currentValue || 0) / Math.max(1, a.targetValue || 1);
        const bPct = (b.currentValue || 0) / Math.max(1, b.targetValue || 1);
        return aPct - bPct;
      });
    }
    if (sortMode === 'streak') {
      return [...list].sort((a, b) => {
        const aPct = (a.currentValue || 0) / Math.max(1, a.targetValue || 1);
        const bPct = (b.currentValue || 0) / Math.max(1, b.targetValue || 1);
        return bPct - aPct;
      });
    }
    return list;
  }, [goals, searchQuery, sortMode]);

  // 7-Day Monochrome Rhythm Matrix
  const weeklyRhythm = useMemo(() => {
    return weekDays.map((dayObj) => {
      const doneCount = habits.filter((h) => (h.completedDates || []).includes(dayObj.dateStr)).length;
      const ratio = habits.length > 0 ? doneCount / habits.length : 0;
      return {
        ...dayObj,
        doneCount,
        ratio,
      };
    });
  }, [weekDays, habits]);

  // Handle completing a Deep Focus Pomodoro session
  const handleFocusSessionComplete = ({
    minutes,
    xpEarned,
    linkedHabitId,
    linkedGoalId,
  }: {
    minutes: number;
    xpEarned: number;
    linkedHabitId?: string;
    linkedGoalId?: string;
  }) => {
    handleAdjustXp(xpEarned, `${minutes}m Focus Studio Completed`);
    if (linkedHabitId) {
      const targetHabit = habits.find((h) => h.id === linkedHabitId);
      if (targetHabit) {
        if (targetHabit.trackingType === 'sets') {
          handleLogHabitSet(linkedHabitId, targetHabit.stepValue || 1);
        } else if (!(targetHabit.completedDates || []).includes(todayStr)) {
          handleToggleHabit(linkedHabitId);
        }
      }
    }
    if (linkedGoalId) {
      handleUpdateGoalValue(linkedGoalId, 1);
    }
    notificationManager.sendNotification(
      'Deep Focus Session Complete',
      `Earned +${xpEarned} XP from ${minutes} minutes of uninterrupted focus.`,
      'xp'
    );
  };

  // Gamification level progress
  const userXp = profile.xp || 0;
  const levelInfo = calculateLevelProgress(userXp);
  const rankInfo = getRankInfo(levelInfo.level);

  return (
    <AndroidFrame isReverseZone={isReverseZone}>
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Connectivity Status Banner */}
      <OfflineIndicator />

      {/* Reverse Habit Zone Audit Modal */}
      <ReverseZoneAuditModal
        isOpen={showReverseAuditModal}
        onClose={() => setShowReverseAuditModal(false)}
        penalties={reverseHistory}
        onClearHistory={handleClearReverseHistory}
      />

      {/* Deep Focus Pomodoro Studio Modal */}
      <FocusTimerModal
        isOpen={showFocusModal}
        onClose={() => setShowFocusModal(false)}
        habits={habits}
        goals={goals}
        onCompleteSession={handleFocusSessionComplete}
      />

      {/* Real-Time Steps Pedometer Studio Modal */}
      <StepCounterModal
        isOpen={showPedometerModal}
        onClose={() => setShowPedometerModal(false)}
        habits={habits}
        goals={goals}
        onSyncStepsToHabit={handleSyncStepsToHabits}
      />

      {/* 1. FIRST TIME ONBOARDING INTRODUCTION (Name, Age & Features Setup) */}
      {isOnboarding && (
        <OnboardingScreen
          initialProfile={profile}
          initialSecurity={security}
          onComplete={handleCompleteOnboarding}
        />
      )}

      {/* 2. REPLAY INTRODUCTION TOUR */}
      {!isOnboarding && isReplayingTour && (
        <OnboardingScreen
          isReplay={true}
          initialProfile={profile}
          initialSecurity={security}
          onCancelReplay={() => setIsReplayingTour(false)}
          onComplete={() => setIsReplayingTour(false)}
        />
      )}

      {/* 3. PASSCODE LOCK SCREEN (On opening the app every time) */}
      {!isOnboarding && !isReplayingTour && isLocked && (
        <LockScreen
          profile={profile}
          security={security}
          onUnlock={() => setIsLocked(false)}
          onUpdateSecurity={handleUpdateSecurity}
        />
      )}

      {/* 4. ACTIVE APP SCREENS (When Unlocked) */}
      {!isOnboarding && !isReplayingTour && !isLocked && (
        <>
          {/* Floating XP Animation Pill - Monochrome Inverted Contrast */}
          <AnimatePresence>
            {floatingXp && (
              <motion.div
                key={floatingXp.id}
                initial={{ opacity: 0, y: 18, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className="fixed bottom-20 right-6 z-50 pointer-events-none"
              >
                <div className="px-3.5 py-2 rounded-full bg-primary text-on-primary font-black text-xs shadow-2xl flex items-center gap-1.5 border border-outline/20 font-mono tabular-nums">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>{floatingXp.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full Screen Mode: Habit Details (Complete Information from Beginning) */}
          {screenView === 'habit-detail' && selectedHabitForDetail && (
            <HabitDetailScreen
              habit={habits.find((h) => h.id === selectedHabitForDetail.id) || selectedHabitForDetail}
              todayStr={todayStr}
              onBack={() => setScreenView('dashboard')}
              onToggleHabit={handleToggleHabit}
              onLogHabitSet={handleLogHabitSet}
              onDeleteHabit={(id) => {
                handleDeleteHabit(id);
                setScreenView('dashboard');
              }}
              onResetHabit={handleResetHabit}
              onEditHabit={(h) => {
                setEditingHabit(h);
                setScreenView('add-habit');
              }}
              onUpdateHabit={handleUpdateHabit}
              linkedGoal={goals.find((g) => g.id === selectedHabitForDetail.linkedGoalId)}
              onOpenGoalDetail={(g) => {
                setSelectedGoalForDetail(g);
                setScreenView('goal-detail');
                sound.playPop();
              }}
            />
          )}

          {/* Full Screen Mode: Goal Details (Complete Information from Beginning) */}
          {screenView === 'goal-detail' && selectedGoalForDetail && (
            <GoalDetailScreen
              goal={goals.find((g) => g.id === selectedGoalForDetail.id) || selectedGoalForDetail}
              currency={settings.currency}
              onBack={() => setScreenView('dashboard')}
              onUpdateGoalValue={handleUpdateGoalValue}
              onToggleSubtask={handleToggleSubtask}
              onOpenCalendar={handleOpenCalendar}
              onDeleteGoal={(id) => {
                handleDeleteGoal(id);
                setScreenView('dashboard');
              }}
              onResetGoal={handleResetGoal}
              onEditGoal={(g) => {
                setEditingGoal(g);
                setScreenView('add-goal');
                sound.playPop();
              }}
              onUpdateGoal={handleUpdateGoal}
              linkedHabit={habits.find((h) => h.id === selectedGoalForDetail.linkedHabitId)}
              onOpenHabitDetail={(h) => {
                setSelectedHabitForDetail(h);
                setScreenView('habit-detail');
                sound.playPop();
              }}
            />
          )}

          {/* Full Screen Mode: Habits Studio */}
          {screenView === 'habits' && (
            <HabitsScreen
              habits={habits}
              todayStr={todayStr}
              onBack={() => setScreenView('dashboard')}
              onOpenAddHabit={() => setScreenView('add-habit')}
              onToggleHabit={handleToggleHabit}
              onLogHabitSet={handleLogHabitSet}
              onDeleteHabit={handleDeleteHabit}
              onEditHabit={(h) => {
                setEditingHabit(h);
                setScreenView('add-habit');
              }}
              onSelectHabit={(h) => {
                setSelectedHabitForDetail(h);
                setScreenView('habit-detail');
                sound.playPop();
              }}
              goals={goals}
            />
          )}

          {/* Full Screen Mode: Goals View */}
          {screenView === 'goals' && (
            <GoalsScreen
              goals={goals}
              onBack={() => setScreenView('dashboard')}
              onOpenCalendar={handleOpenCalendar}
              onUpdateGoalValue={handleUpdateGoalValue}
              onDeleteGoal={handleDeleteGoal}
              onEditGoal={(g) => {
                setEditingGoal(g);
                setScreenView('add-goal');
                sound.playPop();
              }}
              onSelectGoal={(g) => {
                setSelectedGoalForDetail(g);
                setScreenView('goal-detail');
                sound.playPop();
              }}
              currency={settings.currency}
            />
          )}

          {/* Full Screen Mode: Goals & Habits Progress Calendar View */}
          {screenView === 'calendar' && (
            <GoalCalendarScreen
              goals={goals}
              habits={habits}
              selectedGoalId={calendarGoalId}
              onBack={() => setScreenView('dashboard')}
              currency={settings.currency}
              onToggleHabit={handleToggleHabit}
            />
          )}

          {/* Full Screen Mode: Settings View */}
          {screenView === 'settings' && (
            <SettingsScreen
              settings={settings}
              onUpdateSettings={updateSettings}
              onBack={() => setScreenView('dashboard')}
              onResetAllData={handleResetAllData}
              totalGoalsCount={goals.length}
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              security={security}
              onUpdateSecurity={handleUpdateSecurity}
              onReplayTour={() => setIsReplayingTour(true)}
              onLockNow={() => setIsLocked(true)}
              onRestoreBackup={handleRestoreBackup}
              onResetDailyHabits={handleManualDailyHabitReset}
              onOpenCalendar={() => handleOpenCalendar()}
              habits={habits}
              goals={goals}
              isReverseZone={isReverseZone}
              onToggleReverseZone={(active) => {
                setIsReverseZone(active);
                storage.saveReverseZoneActive(active);
                updateSettings({ reverseZoneActive: active });
              }}
            />
          )}

          {/* Full Screen Mode: Player Profile & Trophies View */}
          {screenView === 'profile' && (
            <ProfileScreen
              profile={profile}
              habits={habits}
              goals={goals}
              onBack={() => setScreenView('dashboard')}
              onUpdateProfile={handleUpdateProfile}
              onToggleHabit={handleToggleHabit}
              onRestoreStarterHabits={handleRestoreStarterHabits}
              onOpenScrapbook={() => setScreenView('scrapbook')}
            />
          )}

          {/* Full Screen Mode: Growth Scrapbook & Time Capsules View */}
          {screenView === 'scrapbook' && (
            <ScrapbookScreen
              capsules={capsules}
              goals={goals}
              habits={habits}
              profile={profile}
              onBack={() => setScreenView('dashboard')}
              onAddCapsule={handleAddCapsule}
              onDeleteCapsule={handleDeleteCapsule}
              onOpenHabitDetail={(habit) => {
                setSelectedHabitForDetail(habit);
                setScreenView('habit-detail');
                sound.playPop();
              }}
              onOpenGoalDetail={(goal) => {
                setSelectedGoalForDetail(goal);
                setScreenView('goal-detail');
                sound.playPop();
              }}
            />
          )}

          {/* Dedicated Tab/Screen Mode: Step Analytics & Real-Time Tracker */}
          {screenView === 'pedometer' && (
            <StepAnalyticsScreen
              onBack={() => setScreenView('dashboard')}
              habits={habits}
              goals={goals}
              onSyncStepsToHabits={handleSyncStepsToHabits}
            />
          )}

          {/* Main Single Screen: Dashboard */}
          {screenView === 'dashboard' && (
            <div className="flex-1 flex flex-col min-h-full bg-surface text-on-surface animate-noir-enter">
              {/* Sticky Dashboard Header Bar */}
              <header
                style={{ marginTop: '32px', marginLeft: '0px' }}
                className="sticky top-0 z-30 border-b border-outline-variant/30 px-4 mt-8 ml-0 pt-8 pb-2.5 text-[20px] shrink-0 flex items-center justify-between gap-2 bg-surface/95 backdrop-blur-md"
              >
                {/* App Brand Title */}
                <div
                  style={{ fontSize: '25px' }}
                  className="text-[25px] font-black tracking-tight text-on-surface select-none"
                >
                  OrbitGoals
                </div>

                {/* Action Icons in Header: Step Counter, Calendar, Scrapbook, Settings */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Step Counter & Analytics Tab Launcher */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setScreenView('pedometer');
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/40 relative"
                    title={pedometerState.isWalkingMode ? 'Walking Mode: Active (Counting Steps)' : 'Step Analytics (Walking Mode: OFF)'}
                  >
                    <Footprints className={`w-4 h-4 ${pedometerState.isWalkingMode ? 'text-primary animate-pulse' : 'text-on-surface-variant'}`} />
                    {pedometerState.isWalkingMode && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface" />
                    )}
                  </motion.button>

                  {/* Calendar Launcher */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleOpenCalendar()}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/40"
                    title="Open Habits & Goals Calendar"
                  >
                    <Calendar className="w-4 h-4 text-on-surface" />
                  </motion.button>

                  {/* Growth Scrapbook Launcher */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setScreenView('scrapbook');
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/40 relative"
                    title="Open Growth Scrapbook & Time Capsules"
                  >
                    <Camera className="w-4 h-4 text-on-surface" />
                  </motion.button>

                  {/* Settings Option Button */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setScreenView('settings')}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/40"
                    title="Open Settings"
                  >
                    <Settings className="w-4 h-4 text-on-surface" />
                  </motion.button>
                </div>
              </header>

              {/* Dashboard Natural Scroll Body */}
              <div className="flex-1 px-4 pt-3 pb-24 space-y-3">
                {/* PLAYER MOMENTUM & DEEP FOCUS STUDIO COMMAND STRIP */}
                <div className="flex items-stretch gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      setScreenView('profile');
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className="flex-1 min-w-0 px-3 py-2 rounded-2xl bg-surface-container-low border border-outline-variant/40 hover:border-primary/50 transition-colors cursor-pointer text-left flex items-center justify-between gap-2.5"
                    title="Open Player Profile & Trophies"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-on-surface truncate">
                        <span className="font-mono">Lv.{levelInfo.level}</span>
                        <span className="text-on-surface-variant">·</span>
                        <span className="truncate">{rankInfo.title}</span>
                        <span className="text-on-surface-variant font-mono ml-auto shrink-0">
                          v{APP_VERSION}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(4, levelInfo.percent)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full bg-primary noir-shimmer"
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono font-black tabular-nums text-on-surface block leading-none">
                        {levelInfo.percent}%
                      </span>
                      <span className="text-[9px] text-on-surface-variant font-mono block mt-0.5">
                        {userXp.toLocaleString()} XP
                      </span>
                    </div>
                  </motion.button>
                </div>

                {/* ANIMATED SEGMENTED HABITS / GOALS TOGGLE */}
                <div className="relative grid grid-cols-2 p-1 rounded-2xl bg-surface-container border border-outline-variant/40 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('habits');
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className={`relative z-10 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'habits' ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {activeTab === 'habits' && (
                      <motion.div
                        layoutId="dashboardTabIndicator"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-primary shadow-sm -z-10"
                      />
                    )}
                    <Repeat className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="font-mono tabular-nums">Habits ({completedHabitsCount}/{totalHabits})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('goals');
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className={`relative z-10 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'goals' ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {activeTab === 'goals' && (
                      <motion.div
                        layoutId="dashboardTabIndicator"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-primary shadow-sm -z-10"
                      />
                    )}
                    <Target className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="font-mono tabular-nums">Goals ({completedGoalsCount}/{totalGoals})</span>
                  </button>
                </div>

                {/* OVERVIEW CARD, 7-DAY RHYTHM MATRIX & BIG ADD BUTTON */}
                <div className="space-y-2.5">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="noir-card rounded-2xl p-3.5 border border-outline-variant/40 bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low shadow-xs space-y-3"
                  >
                    {activeTab === 'habits' ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface flex items-center gap-1.5">
                            {isReverseZone && <Flame className="w-3 h-3 fill-current" />}
                            <span>{isReverseZone ? "Today's Habits · Reverse Mode" : "Today's Habits Overview"}</span>
                          </span>
                          <span className="text-[11px] font-mono tabular-nums text-on-surface font-black flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-current" />
                            <span>+{securedXp} XP today</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <h2 className="text-[20px] font-black text-on-surface tracking-tight leading-tight truncate">
                              {totalHabits === 0
                                ? 'No Habits Yet'
                                : habitsPct === 100
                                ? 'All Habits Complete'
                                : isReverseZone
                                ? `${totalHabits - completedHabitsCount} Habit${totalHabits - completedHabitsCount === 1 ? '' : 's'} at Risk`
                                : `${totalHabits - completedHabitsCount} Habit${totalHabits - completedHabitsCount === 1 ? '' : 's'} Remaining`}
                            </h2>
                            <p className="text-[11px] text-on-surface-variant font-medium truncate">
                              {isReverseZone
                                ? `${totalHabits - completedHabitsCount} pending · -${potentialXpLoss} XP at 11:59 PM if missed`
                                : totalHabits === 0
                                ? 'Create your first daily habit below.'
                                : `${completedHabitsCount} of ${totalHabits} completed today`}
                            </p>
                          </div>

                          {/* Circular Completion Ring */}
                          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-surface-container-highest"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <motion.path
                                className="text-primary"
                                initial={{ strokeDasharray: '0, 100' }}
                                animate={{ strokeDasharray: `${habitsPct}, 100` }}
                                transition={{ duration: 0.65, ease: 'easeOut' }}
                                strokeLinecap="round"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute text-center">
                              <span className="text-[12px] font-black text-on-surface font-mono tabular-nums leading-none">
                                {habitsPct}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 7-Day Monochrome Rhythm Matrix */}
                        <div className="pt-2 border-t border-outline-variant/25 flex items-center justify-between gap-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant shrink-0">
                            7D Rhythm
                          </span>
                          <div className="flex items-end gap-1.5 flex-1 justify-end">
                            {weeklyRhythm.map((day) => {
                              const heightPct = day.ratio > 0 ? Math.max(24, Math.round(day.ratio * 100)) : 12;
                              return (
                                <div
                                  key={day.dateStr}
                                  className="flex flex-col items-center gap-1"
                                  title={`${day.dayLetter} (${day.dateStr}): ${day.doneCount}/${totalHabits} habits`}
                                >
                                  <div
                                    className={`w-4 h-5 rounded-md bg-surface-container-highest flex items-end overflow-hidden p-[1px] ${
                                      day.isToday ? 'ring-1 ring-primary' : ''
                                    }`}
                                  >
                                    <div
                                      className={`w-full rounded-sm transition-all duration-500 ${
                                        day.ratio > 0 ? 'bg-primary' : 'bg-outline-variant/40'
                                      }`}
                                      style={{ height: `${heightPct}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-[8px] font-mono leading-none ${
                                      day.isToday ? 'font-black text-on-surface' : 'text-on-surface-variant'
                                    }`}
                                  >
                                    {day.dayLetter}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Monochrome Reverse Cutoff Bar */}
                        {isReverseZone && (
                          <div className="pt-2 border-t border-outline-variant/25 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-on-surface">
                              <Clock className="w-3.5 h-3.5 text-on-surface" />
                              <span>Cutoff: {countdownToMidnight}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setShowReverseAuditModal(true)}
                                className="px-2.5 py-1 rounded-lg bg-surface text-on-surface font-bold text-[10px] border border-outline-variant/40 hover:bg-surface-container-high transition-colors cursor-pointer"
                              >
                                Ledger ({reverseHistory.length})
                              </button>
                              {uncompletedHabits.length > 0 && (
                                <button
                                  type="button"
                                  onClick={handleSettleReversePenaltiesNow}
                                  className="px-2.5 py-1 rounded-lg bg-primary text-on-primary font-black text-[10px] shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                                  title="Audit and deduct uncompleted habits now (11:59 PM Test)"
                                >
                                  Settle Cutoff
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">
                            Today's Goals Overview
                          </span>
                          <span className="text-[11px] font-mono text-on-surface-variant font-bold">
                            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <h2 className="text-[20px] font-black text-on-surface tracking-tight leading-tight truncate">
                              {totalGoals === 0
                                ? 'No Goals Yet'
                                : goalsPct === 100
                                ? 'All Goals Completed'
                                : `${totalGoals - completedGoalsCount} Goal${totalGoals - completedGoalsCount === 1 ? '' : 's'} Remaining`}
                            </h2>
                            <p className="text-[11px] text-on-surface-variant font-medium truncate">
                              {totalGoals === 0
                                ? 'Tap "+ Add Goal" below to start.'
                                : `${completedGoalsCount} of ${totalGoals} goals finished today.`}
                            </p>
                          </div>

                          {/* Circular Completion Ring */}
                          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-surface-container-highest"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <motion.path
                                className="text-primary"
                                initial={{ strokeDasharray: '0, 100' }}
                                animate={{ strokeDasharray: `${goalsPct}, 100` }}
                                transition={{ duration: 0.65, ease: 'easeOut' }}
                                strokeLinecap="round"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute text-center">
                              <span className="text-[12px] font-black text-on-surface font-mono tabular-nums leading-none">
                                {goalsPct}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>

                  {/* PRIMARY ADAPTING "ADD HABIT" OR "ADD GOAL" CTA */}
                  {activeTab === 'habits' ? (
                    <motion.button
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        setEditingHabit(undefined);
                        setScreenView('add-habit');
                        sound.playPop();
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-primary text-on-primary font-black text-sm shadow-md hover:opacity-95 transition-opacity cursor-pointer flex items-center justify-between min-h-[48px]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-on-primary/15 flex items-center justify-center">
                          <Plus className="w-4 h-4 stroke-[3] text-on-primary" />
                        </div>
                        <span className="text-[15px]">Add Habit</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold opacity-85">
                        +{settings.habitXpPerSet ?? XP_PER_HABIT} XP / set
                      </span>
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        setEditingGoal(undefined);
                        setScreenView('add-goal');
                        sound.playPop();
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-primary text-on-primary font-black text-sm shadow-md hover:opacity-95 transition-opacity cursor-pointer flex items-center justify-between min-h-[48px]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-on-primary/15 flex items-center justify-center">
                          <Plus className="w-4 h-4 stroke-[3] text-on-primary" />
                        </div>
                        <span className="text-[15px]">Add Goal</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold opacity-85">
                        +{settings.goalXpPerStep ?? XP_PER_GOAL_STEP} XP / step
                      </span>
                    </motion.button>
                  )}

                  {/* Search & Smart Sort Utility Bar */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={activeTab === 'habits' ? 'Search habits...' : 'Search goals...'}
                        className="w-full pl-8 pr-8 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-semibold text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                          title="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextSort: Record<typeof sortMode, typeof sortMode> = {
                          default: 'pending',
                          pending: 'streak',
                          streak: 'default',
                        };
                        setSortMode(nextSort[sortMode]);
                        sound.playPop();
                      }}
                      className="px-2.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface hover:bg-surface-container-high text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                      title="Cycle sort order"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>
                        {sortMode === 'default'
                          ? 'Default'
                          : sortMode === 'pending'
                          ? 'Pending'
                          : activeTab === 'habits'
                          ? 'Streak'
                          : 'Progress'}
                      </span>
                    </button>
                  </div>

                  {/* Category Time-of-Day Filter Bar (Clean Monochrome) */}
                  {activeTab === 'habits' && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                      {[
                        { id: 'all', label: `All (${habits.length})` },
                        {
                          id: 'morning',
                          label: `Morning (${habits.filter((h) => h.timeOfDay === 'morning').length})`,
                        },
                        {
                          id: 'afternoon',
                          label: `Afternoon (${habits.filter((h) => h.timeOfDay === 'afternoon').length})`,
                        },
                        {
                          id: 'evening',
                          label: `Evening (${habits.filter((h) => h.timeOfDay === 'evening').length})`,
                        },
                        {
                          id: 'anytime',
                          label: `Anytime (${habits.filter((h) => !h.timeOfDay || h.timeOfDay === 'anytime').length})`,
                        },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setHabitFilter(f.id as typeof habitFilter);
                            sound.playPop();
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                            habitFilter === f.id
                              ? 'bg-primary text-on-primary border-primary shadow-xs'
                              : 'bg-surface-container border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* List Header Label */}
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                      {activeTab === 'habits'
                        ? `Daily Habits (${filteredHabits.length})`
                        : `Active Goals (${filteredGoals.length})`}
                    </h3>
                    <span className="text-[11px] text-on-surface-variant font-mono font-medium">
                      {activeTab === 'habits'
                        ? `+${XP_PER_HABIT} XP / habit`
                        : `+${XP_PER_GOAL_STEP} XP / step`}
                    </span>
                  </div>
                </div>

                {/* HABITS TAB CONTENT - Pure Monochrome Staggered Cards */}
                {activeTab === 'habits' && (
                  <>
                    <div className="space-y-2.5">
                      {filteredHabits.map((habit, idx) => {
                        const isDoneToday = (habit.completedDates || []).includes(todayStr);
                        const isSets = habit.trackingType === 'sets';
                        const target = habit.targetValue || 30;
                        const current = typeof habit.todayProgress === 'number' ? habit.todayProgress : (isDoneToday ? target : 0);
                        const pct = isSets ? Math.min(100, Math.round((current / target) * 100)) : (isDoneToday ? 100 : 0);
                        const habitXp = habit.xpPerSet || XP_PER_HABIT;

                        return (
                          <motion.div
                            key={habit.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.25) }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => {
                              setSelectedHabitForDetail(habit);
                              setScreenView('habit-detail');
                              sound.playPop();
                              triggerHaptic('light');
                            }}
                            className={`noir-card rounded-2xl border p-3 shadow-xs space-y-2 transition-colors cursor-pointer ${
                              isDoneToday
                                ? 'bg-surface-container border-primary/50'
                                : 'bg-surface-container-low border-outline-variant/40 hover:border-primary/50'
                            }`}
                          >
                            {/* Summary Row: Check circle, Icon & Title, %, Streak, Chevron */}
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {/* Interactive Quick Check Toggle Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleHabit(habit.id);
                                  }}
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer active:scale-90 ${
                                    isDoneToday
                                      ? 'bg-primary border-primary text-on-primary shadow-xs'
                                      : 'border-outline-variant hover:border-primary text-transparent bg-surface'
                                  }`}
                                  title={isDoneToday ? 'Mark as incomplete' : 'Mark as completed today'}
                                >
                                  <Check
                                    className={`w-3.5 h-3.5 stroke-[3] transition-transform ${
                                      isDoneToday ? 'scale-100 text-on-primary' : 'scale-0'
                                    }`}
                                  />
                                </button>

                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                    isDoneToday
                                      ? 'bg-primary text-on-primary border-primary'
                                      : 'bg-surface-container-high text-on-surface border-outline-variant/40'
                                  }`}
                                >
                                  <GoalIcon iconId={habit.icon} className="w-3.5 h-3.5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`text-sm font-bold truncate ${
                                        isDoneToday ? 'line-through text-on-surface-variant' : 'text-on-surface'
                                      }`}
                                    >
                                      {habit.title}
                                    </span>

                                    {habit.streakDays > 0 && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-black tabular-nums text-on-surface-variant">
                                        <Flame className="w-2.5 h-2.5 fill-current text-on-surface" />
                                        <span>{habit.streakDays}d</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right summary: Tabular % & Chevron */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-[11px] font-mono font-black tabular-nums ${
                                    pct === 100
                                      ? 'text-on-surface underline decoration-2 underline-offset-2'
                                      : pct > 0
                                      ? 'text-on-surface'
                                      : 'text-on-surface-variant'
                                  }`}
                                >
                                  {pct}%
                                </span>

                                <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-60" />
                              </div>
                            </div>

                            {/* Sleek Monochrome Progress Bar */}
                            <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 bg-primary ${
                                  pct === 100 ? 'noir-shimmer' : ''
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Reverse Habit Status Line (Pure Monochrome Contrast) */}
                            {isReverseZone && (
                              <div className="pt-1 flex items-center justify-between text-[10px] font-bold border-t border-outline-variant/20">
                                {isDoneToday ? (
                                  <span className="text-on-surface flex items-center gap-1 font-mono text-[9px] font-black">
                                    <Shield className="w-3 h-3 fill-current" />
                                    <span>Shielded · +{habitXp} XP Secured</span>
                                  </span>
                                ) : (
                                  <span className="text-on-surface flex items-center gap-1 font-mono text-[9px] font-black">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>At Risk · -{habitXp} XP at 11:59 PM</span>
                                  </span>
                                )}
                                <span className="text-on-surface-variant text-[9px] font-medium">
                                  {isDoneToday ? 'Zero penalty' : 'Tap circle to protect'}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {filteredHabits.length === 0 && habits.length > 0 && (
                      <div className="text-center py-8 bg-surface-container-low rounded-3xl border border-outline-variant/40 p-5 space-y-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-surface-container-high text-on-surface flex items-center justify-center mx-auto border border-outline-variant/30">
                          <Repeat className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-on-surface">No matching habits</h4>
                        <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                          Try clearing your search or switching back to all time slots.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setHabitFilter('all');
                            setSearchQuery('');
                            sound.playPop();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
                        >
                          <span>Show All Habits ({habits.length})</span>
                        </button>
                      </div>
                    )}

                    {habits.length === 0 && (
                      <div className="text-center py-10 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/50 p-6 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-on-surface flex items-center justify-center mx-auto border border-outline-variant/30">
                          <Repeat className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-on-surface">No habits yet</h4>
                        <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                          Your habits list is fresh and clean. Tap below to create your first daily habit.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHabit(undefined);
                            setScreenView('add-habit');
                            sound.playPop();
                          }}
                          className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Create First Habit</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* GOALS TAB CONTENT - Pure Monochrome Staggered Cards */}
                {activeTab === 'goals' && (
                  <>
                    <div className="space-y-2.5">
                      {filteredGoals.map((goal, idx) => {
                        const target = typeof goal.targetValue === 'number' && !isNaN(goal.targetValue) && goal.targetValue > 0 ? goal.targetValue : 1;
                        const current = typeof goal.currentValue === 'number' && !isNaN(goal.currentValue) ? Math.max(0, goal.currentValue) : 0;
                        const pct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));

                        return (
                          <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.25) }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => {
                              setSelectedGoalForDetail(goal);
                              setScreenView('goal-detail');
                              sound.playPop();
                              triggerHaptic('light');
                            }}
                            className="noir-card bg-surface-container-low border border-outline-variant/40 rounded-2xl p-3 shadow-xs space-y-2 transition-colors cursor-pointer hover:border-primary/50"
                          >
                            {/* Single Row: Icon, Title & Tabular Metrics, Quick Steppers, Chevron */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                    pct === 100
                                      ? 'bg-primary text-on-primary border-primary'
                                      : 'bg-surface-container-high text-on-surface border-outline-variant/40'
                                  }`}
                                >
                                  <GoalIcon iconId={goal.icon} className="w-4 h-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-on-surface truncate">
                                      {goal.title}
                                    </span>
                                    {goal.linkedHabitId && (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                                        <Sparkles className="w-2.5 h-2.5 text-on-surface" />
                                        <span>Synced</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-mono tabular-nums">
                                    <span className="font-black text-on-surface">
                                      {pct}%
                                    </span>
                                    <span className="text-on-surface-variant">·</span>
                                    <span className="text-on-surface-variant truncate">
                                      {goal.category === 'finance' ? settings.currency : ''}
                                      {current.toLocaleString()} / {goal.category === 'finance' ? settings.currency : ''}
                                      {target.toLocaleString()} {goal.unit || 'units'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Compact Right Control Buttons: Minus, Plus, Chevron */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateGoalValue(goal.id, -1);
                                  }}
                                  disabled={current <= 0}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface text-on-surface hover:bg-surface-container font-bold active:scale-95 transition-all border border-outline-variant/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title="Subtract 1 unit (-1)"
                                >
                                  <Minus className="w-3 h-3 stroke-[2.5]" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateGoalValue(goal.id, 1);
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-on-primary font-black active:scale-95 transition-all cursor-pointer shadow-xs hover:opacity-90"
                                  title="Add 1 unit (+1)"
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                </button>

                                <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-60 ml-0.5" />
                              </div>
                            </div>

                            {/* Monochrome Progress Bar */}
                            <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 bg-primary ${
                                  pct === 100 ? 'noir-shimmer' : ''
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {filteredGoals.length === 0 && goals.length > 0 && (
                      <div className="text-center py-8 bg-surface-container-low rounded-3xl border border-outline-variant/40 p-5 space-y-2.5">
                        <h4 className="text-sm font-bold text-on-surface">No matching goals</h4>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs cursor-pointer"
                        >
                          Clear Search
                        </button>
                      </div>
                    )}

                    {goals.length === 0 && (
                      <div className="text-center py-10 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/50 p-6 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-on-surface flex items-center justify-center mx-auto border border-outline-variant/30">
                          <ListTodo className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-on-surface">No goals yet</h4>
                        <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                          Tap "Add Goal" above to create your first goal and earn +50 XP per step.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Bottom Sheet Popup: Add Habit (slides up smoothly below screen) */}
          {screenView === 'add-habit' && (
            <AddHabitScreen
              onBack={() => {
                setEditingHabit(undefined);
                setScreenView('dashboard');
              }}
              onSaveHabit={handleSaveHabit}
              existingHabit={editingHabit}
              goals={goals}
            />
          )}

          {/* Bottom Sheet Popup: Add Goal (slides up smoothly below screen) */}
          {screenView === 'add-goal' && (
            <AddGoalScreen
              onBack={() => {
                setEditingGoal(undefined);
                setScreenView('dashboard');
              }}
              onSaveGoal={handleSaveGoal}
              currency={settings.currency}
              existingGoal={editingGoal}
              defaultXpPerStep={settings.goalXpPerStep || 50}
            />
          )}
        </>
      )}
    </AndroidFrame>
  );
}
