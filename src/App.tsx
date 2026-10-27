/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Goal, Habit, AppSettings, UserProfile, SecurityConfig, HabitTimeOfDay } from './types';
import { storage } from './utils/storage';
import { sound, triggerHaptic } from './utils/sound';
import { fireConfetti } from './utils/confetti';
import { notificationManager } from './utils/notifications';
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
import { ProfileScreen } from './components/ProfileScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { LockScreen } from './components/LockScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { ToastContainer } from './components/ToastContainer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GoalIcon } from './components/GoalIcon';
import { INITIAL_HABITS } from './utils/initialData';

import {
  Plus,
  Minus,
  Target,
  Settings,
  Trash2,
  ListTodo,
  Calendar,
  Repeat,
  Flame,
  Sparkles,
  Check,
  Shield,
  Zap,
  User,
  ChevronRight,
  Link,
  Layers,
} from 'lucide-react';

export default function App() {
  const [goals, setGoals] = useState<Goal[]>(() => storage.getGoals());
  const [habits, setHabits] = useState<Habit[]>(() => storage.getHabits());
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [profile, setProfile] = useState<UserProfile>(() => storage.getProfile());
  const [security, setSecurity] = useState<SecurityConfig>(() => storage.getSecurity());

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

  // Screen View: 'dashboard' | 'goals' | 'habits' | 'add-goal' | 'add-habit' | 'calendar' | 'settings' | 'profile'
  const [screenView, setScreenView] = useState<
    'dashboard' | 'goals' | 'habits' | 'add-goal' | 'add-habit' | 'calendar' | 'settings' | 'profile'
  >('dashboard');
  const [calendarGoalId, setCalendarGoalId] = useState<string | undefined>(undefined);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  // Floating XP indicator state
  const [floatingXp, setFloatingXp] = useState<{ text: string; id: number } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const weekDays = getCurrentWeekDays();

  // Apply Theme & Low Power Mode cleanly to root
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

  useEffect(() => {
    const root = document.documentElement;
    if (settings.lowPowerMode) {
      root.classList.add('low-power-mode');
    } else {
      root.classList.remove('low-power-mode');
    }
  }, [settings.lowPowerMode]);

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
      const setXp = habit.xpPerSet || (habit.unit === 'videos' ? 50 : 10);
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

  // Save New or Edited Habit
  const handleSaveHabit = (
    habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streakDays' | 'bestStreak'>
  ) => {
    if (editingHabit) {
      const updated = habits.map((h) =>
        h.id === editingHabit.id ? { ...h, ...habitData } : h
      );
      updateHabits(updated);
      setEditingHabit(undefined);
    } else {
      const newHabit: Habit = {
        ...habitData,
        id: `habit-${Date.now()}`,
        createdAt: todayStr,
        streakDays: 0,
        bestStreak: 0,
        completedDates: [],
      };
      updateHabits([newHabit, ...habits]);
    }

    sound.playSuccessChime();
    triggerHaptic('success');
    setHabitFilter('all');
    setScreenView('dashboard');
    setActiveTab('habits');
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

  // Increment or Decrement Goal Value (+50 XP per step)
  const handleUpdateGoalValue = (goalId: string, delta: number) => {
    let hitMilestone = false;
    let milestoneTitle = '';

    const newGoals = goals.map((goal) => {
      if (goal.id !== goalId) return goal;
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
      handleAdjustXp(XP_PER_GOAL_STEP, 'Goal progress step');
    } else if (delta < 0) {
      sound.playPop();
      triggerHaptic('light');
      handleAdjustXp(-XP_PER_GOAL_STEP, 'Goal step reverted');
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

  // Save New Goal (with optional auto-created linked habit)
  const handleSaveGoal = (
    goalData: Omit<Goal, 'id' | 'createdAt' | 'completedDates' | 'history'>,
    autoCreateHabit?: boolean
  ) => {
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
        xpPerSet: isYouTube ? 50 : 10,
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
    setScreenView('dashboard');
    setActiveTab('goals');
  };

  const handleOpenCalendar = (goalId?: string) => {
    setCalendarGoalId(goalId);
    setScreenView('calendar');
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

  // Filtered habits for dashboard list
  const filteredHabits = habits.filter((h) => {
    if (habitFilter === 'all') return true;
    return h.timeOfDay === habitFilter;
  });

  // Gamification level progress
  const userXp = profile.xp || 0;
  const levelInfo = calculateLevelProgress(userXp);
  const rankInfo = getRankInfo(levelInfo.level);

  return (
    <AndroidFrame>
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Connectivity Status Banner */}
      <OfflineIndicator />

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
          {/* Floating XP Animation Pill */}
          {floatingXp && (
            <div className="absolute top-16 right-5 z-50 pointer-events-none animate-bounce">
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs shadow-lg flex items-center gap-1.5 border border-amber-300">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>{floatingXp.text}</span>
              </div>
            </div>
          )}

          {/* Full Screen Mode: Add Habit */}
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
              goals={goals}
            />
          )}

          {/* Full Screen Mode: Add Goal Tab */}
          {screenView === 'add-goal' && (
            <AddGoalScreen
              onBack={() => setScreenView('dashboard')}
              onSaveGoal={handleSaveGoal}
              currency={settings.currency}
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
            />
          )}

          {/* Main Single Screen: Dashboard */}
          {screenView === 'dashboard' && (
            <div className="flex-1 flex flex-col min-h-full bg-surface text-on-surface">
              {/* Sticky Dashboard Header Bar */}
              <header
                style={{ marginTop: '15px', marginLeft: '0px' }}
                className="sticky top-0 z-30 border-b border-outline-variant/20 px-4 mt-[15px] ml-0 pt-8 pb-2.5 text-[20px] shrink-0 flex items-center justify-between gap-2 bg-surface/95 backdrop-blur-md"
              >
                {/* Brand / Profile Launcher Button (Clicking Name or Avatar opens Profile) */}
                  <button
                    type="button"
                    onClick={() => {
                      setScreenView('profile');
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 active:scale-95 transition-all cursor-pointer p-1 -m-1 rounded-2xl group"
                    title="Tap to open Player Profile & Trophies"
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-black text-sm group-hover:ring-2 group-hover:ring-primary/40 transition-all shadow-xs">
                        {profile.name ? profile.name.trim().charAt(0).toUpperCase() : 'G'}
                      </div>
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-[8px] leading-tight shadow-xs border border-surface">
                        Lv.{levelInfo.level}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[18px] font-black tracking-tight text-on-surface block leading-none truncate max-w-[125px] group-hover:text-primary transition-colors">
                          {profile.name || 'OrbitGoals'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors opacity-70" />
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block mt-1 truncate flex items-center gap-1">
                        <span>{rankInfo.badge}</span>
                        <span>{profile.title || rankInfo.title}</span>
                      </span>
                    </div>
                  </button>

                  {/* Action Icons in Header: Habits/Goals Toggle Button, Calendar, Settings */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Habit / Goals Switcher Button */}
                    <button
                      onClick={() => {
                        setActiveTab((prev) => (prev === 'habits' ? 'goals' : 'habits'));
                        sound.playPop();
                        triggerHaptic('light');
                      }}
                      className="h-9 px-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-outline-variant/30 font-black text-xs"
                      title="Switch between Habits and Goals"
                    >
                      {activeTab === 'habits' ? (
                        <>
                          <Repeat className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                          <span className="text-[12px]">Habits</span>
                        </>
                      ) : (
                        <>
                          <Target className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                          <span className="text-[12px]">Goals</span>
                        </>
                      )}
                    </button>

                    {/* Calendar Launcher */}
                    <button
                      onClick={() => handleOpenCalendar()}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
                      title="Open Habits & Goals Calendar"
                    >
                      <Calendar className="w-4 h-4 text-primary" />
                    </button>

                    {/* Settings Option Button */}
                    <button
                      onClick={() => setScreenView('settings')}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
                      title="Open Settings"
                    >
                      <Settings className="w-4 h-4 text-primary" />
                    </button>
                  </div>
              </header>

              {/* Dashboard Natural Scroll Body */}
              <div className="flex-1 px-4 pt-3 pb-24 space-y-3">
                {/* INTERACTIVE HABIT / GOALS SEGMENTED TOGGLE BUTTON */}
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface-container border border-outline-variant/30 shadow-inner gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('habits');
                        sound.playPop();
                        triggerHaptic('light');
                      }}
                      className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeTab === 'habits'
                          ? 'bg-primary text-on-primary shadow-sm scale-100'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <Repeat className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Habits ({completedHabitsCount}/{totalHabits})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('goals');
                        sound.playPop();
                        triggerHaptic('light');
                      }}
                      className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeTab === 'goals'
                          ? 'bg-primary text-on-primary shadow-sm scale-100'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Goals ({completedGoalsCount}/{totalGoals})</span>
                    </button>
                  </div>

                {/* OVERVIEW CARD & BIG ADD BUTTON */}
                <div className="space-y-2.5">
                  {/* Dynamic Overview Card based on activeTab */}
                  {activeTab === 'habits' ? (
                    <div className="bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low rounded-2xl p-3 border border-outline-variant/30 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-primary">
                          Today's Habits Progress
                        </span>
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>+{completedHabitsCount * 10} XP today</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <h2 className="text-[20px] font-black text-on-surface tracking-tight leading-tight truncate">
                            {totalHabits === 0
                              ? 'No Habits Yet'
                              : habitsPct === 100
                              ? 'All Habits Crushed! 🌟'
                              : `${totalHabits - completedHabitsCount} Habit${totalHabits - completedHabitsCount === 1 ? '' : 's'} Remaining`}
                          </h2>
                          <p className="text-[10px] text-on-surface-variant font-medium truncate">
                            {totalHabits === 0
                              ? 'Tap "+ Add Habit" below to build consistency.'
                              : `${completedHabitsCount} of ${totalHabits} completed · Tap circle to check off`}
                          </p>
                        </div>

                        {/* Circular Completion Ring */}
                        <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-surface-container-highest"
                              strokeWidth="4"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-primary transition-all duration-700 ease-out"
                              strokeDasharray={`${habitsPct}, 100`}
                              strokeLinecap="round"
                              strokeWidth="4"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-[13px] font-black text-on-surface font-mono tabular-nums leading-none">
                              {habitsPct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low rounded-2xl p-3 border border-outline-variant/30 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-primary">
                          Today's Goals Overview
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-bold">
                          {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <h2 className="text-[20px] font-black text-on-surface tracking-tight leading-tight truncate">
                            {totalGoals === 0
                              ? 'No Goals Yet'
                              : goalsPct === 100
                              ? 'All Goals Completed! 🎉'
                              : `${totalGoals - completedGoalsCount} Goal${totalGoals - completedGoalsCount === 1 ? '' : 's'} Remaining`}
                          </h2>
                          <p className="text-[10px] text-on-surface-variant font-medium truncate">
                            {totalGoals === 0
                              ? 'Tap "+ Add Goal" below to start.'
                              : `${completedGoalsCount} of ${totalGoals} goals finished today.`}
                          </p>
                        </div>

                        {/* Circular Completion Ring */}
                        <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-surface-container-highest"
                              strokeWidth="4"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-primary transition-all duration-700 ease-out"
                              strokeDasharray={`${goalsPct}, 100`}
                              strokeLinecap="round"
                              strokeWidth="4"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-[13px] font-black text-on-surface font-mono tabular-nums leading-none">
                              {goalsPct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BIG ADAPTING "ADD HABIT" OR "ADD GOAL" BUTTON */}
                  {activeTab === 'habits' ? (
                    <button
                      onClick={() => setScreenView('add-habit')}
                      className="w-full py-3 px-4 rounded-2xl bg-primary text-on-primary font-black text-sm shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[46px]"
                    >
                      <div className="w-5 h-5 rounded-full bg-on-primary/15 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5 stroke-[3] text-on-primary" />
                      </div>
                      <span className="text-[16px]">Add Habit</span>
                      <span className="text-[11px] font-bold bg-on-primary/20 px-2 py-0.5 rounded-full">
                        +10 XP
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setScreenView('add-goal')}
                      className="w-full py-3 px-4 rounded-2xl bg-primary text-on-primary font-black text-sm shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[46px]"
                    >
                      <div className="w-5 h-5 rounded-full bg-on-primary/15 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5 stroke-[3] text-on-primary" />
                      </div>
                      <span className="text-[16px]">Add Goal</span>
                      <span className="text-[11px] font-bold bg-on-primary/20 px-2 py-0.5 rounded-full">
                        +50 XP / step
                      </span>
                    </button>
                  )}

                  {/* Category Filter Pills (When on Habits) */}
                  {activeTab === 'habits' && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                      {[
                        { id: 'all', label: `All (${habits.length})` },
                        {
                          id: 'morning',
                          label: `🌅 Morning (${habits.filter((h) => h.timeOfDay === 'morning').length})`,
                        },
                        {
                          id: 'afternoon',
                          label: `☀️ Afternoon (${habits.filter((h) => h.timeOfDay === 'afternoon').length})`,
                        },
                        {
                          id: 'evening',
                          label: `🌙 Evening (${habits.filter((h) => h.timeOfDay === 'evening').length})`,
                        },
                        {
                          id: 'anytime',
                          label: `⏰ Anytime (${habits.filter((h) => !h.timeOfDay || h.timeOfDay === 'anytime').length})`,
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
                              : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* List Header Label */}
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {activeTab === 'habits'
                        ? `Daily Habits (${filteredHabits.length})`
                        : `Active Goals (${goals.length})`}
                    </h3>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      {activeTab === 'habits'
                        ? 'Tap circle to complete (+10 XP)'
                        : 'Tap + / - to step (+50 XP)'}
                    </span>
                  </div>
                </div>

                {/* HABITS TAB CONTENT */}
                {activeTab === 'habits' && (
                  <>
                    {filteredHabits.map((habit) => {
                      const isDoneToday = (habit.completedDates || []).includes(todayStr);
                      const isSets = habit.trackingType === 'sets';
                      const target = habit.targetValue || 30;
                      const current = typeof habit.todayProgress === 'number' ? habit.todayProgress : (isDoneToday ? target : 0);
                      const step = habit.stepValue || (habit.unit === 'videos' ? 1 : 10);
                      const xpReward = habit.xpPerSet || (habit.unit === 'videos' ? 50 : 10);
                      const isTargetExceeded = current > target;
                      const pct = Math.min(100, Math.round((current / target) * 100));

                      return (
                        <div
                          key={habit.id}
                          className={`rounded-2xl border p-3 shadow-xs space-y-2 transition-all ${
                            isDoneToday
                              ? 'bg-surface-container-low/75 border-primary/30 opacity-95'
                              : 'bg-surface-container-low border-outline-variant/30'
                          }`}
                        >
                          {/* Row 1: Checkbox, Icon, Title, Streaks, Delete */}
                          <div className="flex items-center justify-between gap-2.5">
                            {/* Interactive Checkbox Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleHabit(habit.id)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer active:scale-90 ${
                                isDoneToday
                                  ? 'border-transparent text-white shadow-xs'
                                  : 'border-outline-variant/50 hover:border-primary text-transparent bg-surface'
                              }`}
                              style={isDoneToday ? { backgroundColor: habit.color } : undefined}
                              title={isDoneToday ? 'Mark as incomplete' : 'Mark as completed'}
                            >
                              <Check
                                className={`w-4 h-4 stroke-[3] transition-transform ${
                                  isDoneToday ? 'scale-100 text-white' : 'scale-0'
                                }`}
                              />
                            </button>

                            {/* Habit details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <div
                                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                                >
                                  <GoalIcon iconId={habit.icon} className="w-3 h-3" color={habit.color} />
                                </div>
                                <span
                                  className={`text-sm font-bold truncate ${
                                    isDoneToday ? 'line-through text-on-surface-variant' : 'text-on-surface'
                                  }`}
                                >
                                  {habit.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] flex-wrap">
                                <span
                                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-black tabular-nums ${
                                    habit.streakDays > 0
                                      ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30'
                                      : 'bg-surface text-on-surface-variant border border-outline-variant/20'
                                  }`}
                                >
                                  <Flame className="w-2.5 h-2.5 fill-current" />
                                  <span>{habit.streakDays}d streak</span>
                                </span>

                                <span className="capitalize px-1.5 py-0.5 rounded bg-surface text-on-surface-variant font-medium border border-outline-variant/20">
                                  {habit.timeOfDay}
                                </span>

                                <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-500/25 px-1.5 py-0.5 rounded">
                                  +{xpReward} XP {isSets ? '/ set' : ''}
                                </span>
                              </div>

                              {/* Connected Goal Badge */}
                              {habit.linkedGoalTitle && (
                                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold">
                                  <Link className="w-2.5 h-2.5" />
                                  <span>Connected: {habit.linkedGoalTitle} (+50 XP synced)</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDeleteHabit(habit.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-red-500 hover:bg-surface active:scale-95 transition-all cursor-pointer"
                                title="Delete habit"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Sets Logger on Dashboard card */}
                          {isSets && (
                            <div className="p-2 rounded-xl bg-surface border border-outline-variant/20 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-mono font-black text-on-surface text-[11px]">
                                  {current} / {target} {habit.unit || 'reps'}
                                  {isTargetExceeded && (
                                    <span className="ml-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.5 rounded">
                                      +{current - target} exceeded!
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                  +{xpReward} XP / set
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: isDoneToday ? '#10b981' : habit.color,
                                  }}
                                />
                              </div>

                              {/* Quick set logging controls */}
                              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleLogHabitSet(habit.id, -step)}
                                  disabled={current <= 0}
                                  className="px-2 py-1 rounded-lg bg-surface-container text-red-500 hover:bg-surface-container-high text-xs font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title={`Subtract ${step}`}
                                >
                                  <Minus className="w-3 h-3 stroke-[2.5]" />
                                  <span>-{step}</span>
                                </button>

                                {step >= 10 && (
                                  <button
                                    type="button"
                                    onClick={() => handleLogHabitSet(habit.id, 5)}
                                    className="px-2 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold active:scale-95 transition-all cursor-pointer"
                                    title="Add +5 set"
                                  >
                                    +5 {habit.unit || 'reps'}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleLogHabitSet(habit.id, step)}
                                  className="flex-1 py-1 px-2.5 rounded-lg bg-primary text-on-primary text-xs font-black flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-xs"
                                  title={`Log set of +${step} (+${xpReward} XP)`}
                                >
                                  <Plus className="w-3 h-3 stroke-[3]" />
                                  <span>+{step} {habit.unit || 'reps'}</span>
                                  <span className="text-[9px] bg-on-primary/20 px-1 rounded ml-1">+{xpReward} XP</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Row 2: 7-day mini matrix */}
                          <div className="pt-1.5 border-t border-outline-variant/20 flex items-center justify-between text-[9px] text-on-surface-variant">
                            <span className="font-bold uppercase tracking-wider text-[8px]">
                              Week Progress:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {weekDays.map((d) => {
                                const completed = (habit.completedDates || []).includes(d.dateStr);
                                return (
                                  <div
                                    key={d.dateStr}
                                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black transition-all ${
                                      completed
                                        ? 'text-white'
                                        : d.isToday
                                        ? 'border border-primary text-primary bg-surface'
                                        : 'bg-surface border border-outline-variant/20 text-on-surface-variant opacity-40'
                                    }`}
                                    style={completed ? { backgroundColor: habit.color } : undefined}
                                    title={`${d.dateStr}: ${completed ? 'Done' : 'Missed'}`}
                                  >
                                    {completed ? '✓' : ''}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredHabits.length === 0 && habits.length > 0 && (
                      <div className="text-center py-8 bg-surface-container-low rounded-3xl border border-outline-variant/30 p-5 space-y-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-surface-container-high text-on-surface-variant flex items-center justify-center mx-auto">
                          <Repeat className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-on-surface">No habits in this slot</h4>
                        <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                          You have {habits.length} habits active across your daily schedule.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setHabitFilter('all');
                            sound.playPop();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
                        >
                          <span>Show All Habits ({habits.length})</span>
                        </button>
                      </div>
                    )}

                    {habits.length === 0 && (
                      <div className="text-center py-10 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40 p-6 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                          <Repeat className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-on-surface">No habits yet</h4>
                        <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                          Your habits list is fresh and clean. Tap below to create your first daily habit!
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

                {/* GOALS TAB CONTENT */}
                {activeTab === 'goals' && (
                  <>
                    {goals.map((goal) => {
                      const target = typeof goal.targetValue === 'number' && !isNaN(goal.targetValue) && goal.targetValue > 0 ? goal.targetValue : 1;
                      const current = typeof goal.currentValue === 'number' && !isNaN(goal.currentValue) ? Math.max(0, goal.currentValue) : 0;
                      const pct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));

                      return (
                        <div
                          key={goal.id}
                          className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3 shadow-xs space-y-2 transition-all"
                        >
                          {/* Single Non-Stacking Top Row: Icon, Title, and Action Controls */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                <GoalIcon iconId={goal.icon} className="w-4 h-4" color={goal.color} />
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-bold text-on-surface truncate block">
                                  {goal.title}
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                                    +50 XP / step
                                  </span>
                                  {goal.linkedHabitId && (
                                    <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      <span>Habit Synced</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right compact controls: Calendar Heat Zone, Minus, Plus, Delete */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Calendar Heat Zone button for this individual goal */}
                              <button
                                onClick={() => handleOpenCalendar(goal.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface text-on-surface-variant hover:text-primary active:scale-95 transition-all border border-outline-variant/20 cursor-pointer"
                                title="View Goal Heat Zone Calendar"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>

                              {/* Minus button to subtract 1 unit if mistakenly added */}
                              <button
                                onClick={() => handleUpdateGoalValue(goal.id, -1)}
                                disabled={current <= 0}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface text-red-500 hover:bg-surface-container-high font-bold active:scale-95 transition-all border border-outline-variant/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Subtract 1 unit (-1)"
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>

                              {/* Plus button to add 1 unit (+50 XP) */}
                              <button
                                onClick={() => handleUpdateGoalValue(goal.id, 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface text-primary hover:bg-surface-container-high font-bold active:scale-95 transition-all border border-outline-variant/20 cursor-pointer"
                                title="Add 1 unit (+1 step, +50 XP)"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>

                              {/* Delete goal */}
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-red-500 hover:bg-surface active:scale-95 transition-all cursor-pointer"
                                title="Delete goal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Second Row: Fits in one line */}
                          <div className="flex items-center justify-between gap-2 text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-mono font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[11px] tabular-nums shrink-0">
                                {pct}% Complete
                              </span>

                              <span className="font-mono tabular-nums text-on-surface font-semibold text-xs truncate">
                                {goal.category === 'finance' ? settings.currency : ''}
                                {current.toLocaleString()} / {goal.category === 'finance' ? settings.currency : ''}
                                {target.toLocaleString()} {goal.unit || 'units'}
                              </span>
                            </div>

                            <span className="text-[10px] font-medium text-on-surface-variant px-1.5 py-0.5 rounded bg-surface shrink-0 truncate max-w-[130px]">
                              {formatFrequency(goal)}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%`, backgroundColor: goal.color }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {goals.length === 0 && (
                      <div className="text-center py-10 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40 p-6 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                          <ListTodo className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-on-surface">No goals yet</h4>
                        <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                          Tap the big "Add Goal" button above to create your first goal and earn +50 XP per step.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </AndroidFrame>
  );
}
