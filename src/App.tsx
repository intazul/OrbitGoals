/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Goal, AppSettings } from './types';
import { storage } from './utils/storage';
import { sound, triggerHaptic } from './utils/sound';
import { fireConfetti } from './utils/confetti';
import { notificationManager } from './utils/notifications';

import { AndroidFrame } from './components/AndroidFrame';
import { AddGoalScreen } from './components/AddGoalScreen';
import { GoalsScreen } from './components/GoalsScreen';
import { GoalCalendarScreen } from './components/GoalCalendarScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ToastContainer } from './components/ToastContainer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GoalIcon } from './components/GoalIcon';

import {
  Plus,
  Minus,
  Target,
  Settings,
  Trash2,
  ListTodo,
  Calendar,
} from 'lucide-react';

export default function App() {
  const [goals, setGoals] = useState<Goal[]>(() => storage.getGoals());
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());

  // Screen View: 'dashboard' | 'goals' | 'add-goal' | 'calendar' | 'settings'
  const [screenView, setScreenView] = useState<'dashboard' | 'goals' | 'add-goal' | 'calendar' | 'settings'>('dashboard');
  const [calendarGoalId, setCalendarGoalId] = useState<string | undefined>(undefined);

  const todayStr = new Date().toISOString().split('T')[0];

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
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
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

  // Persist Settings
  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      storage.saveSettings(next);
      return next;
    });
  };

  // Increment or Decrement Goal Value (allows subtracting if mistakenly added)
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

      const history = [...goal.history];
      const todayHistoryIdx = history.findIndex((h) => h.date === todayStr);
      if (todayHistoryIdx >= 0) {
        history[todayHistoryIdx].value = newVal;
      } else {
        history.push({ date: todayStr, value: newVal });
      }

      // Sync completedDates
      let updatedCompletedDates = [...goal.completedDates];
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
    sound.playPop();
    triggerHaptic('light');

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

  // Reset All Goals
  const handleResetAllData = () => {
    if (confirm('Are you sure you want to delete all goals and reset? This cannot be undone.')) {
      updateGoals([]);
      sound.playPop();
      notificationManager.sendNotification('Reset Complete', 'All goals have been cleared.', 'reminder');
      setScreenView('dashboard');
    }
  };

  // Save New Goal
  const handleSaveGoal = (
    goalData: Omit<Goal, 'id' | 'createdAt' | 'completedDates' | 'history'>
  ) => {
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      createdAt: todayStr,
      completedDates: [],
      history: [{ date: todayStr, value: goalData.currentValue }],
    };

    updateGoals([newGoal, ...goals]);
    sound.playSuccessChime();
    triggerHaptic('success');
  };

  const handleOpenCalendar = (goalId?: string) => {
    setCalendarGoalId(goalId);
    setScreenView('calendar');
    sound.playPop();
    triggerHaptic('light');
  };

  const formatFrequency = (goal: Goal) => {
    if (goal.frequency === 'weekly') {
      if (goal.frequencyDays && goal.frequencyDays.length > 0) {
        return `Weekly · ${goal.frequencyDays.join(', ')}`;
      }
      return 'Weekly';
    }
    if (goal.frequency === 'monthly') return 'Monthly';
    return 'Daily';
  };

  const completedTodayCount = goals.filter((g) => g.completedDates.includes(todayStr)).length;
  const totalGoals = goals.length;
  const todayPct = totalGoals > 0 ? Math.round((completedTodayCount / totalGoals) * 100) : 0;
  const uncompletedCount = totalGoals - completedTodayCount;

  return (
    <AndroidFrame>
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Connectivity Status Banner */}
      <OfflineIndicator />

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

      {/* Full Screen Mode: Goals Heat Zone Calendar View */}
      {screenView === 'calendar' && (
        <GoalCalendarScreen
          goals={goals}
          selectedGoalId={calendarGoalId}
          onBack={() => setScreenView('dashboard')}
          currency={settings.currency}
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
        />
      )}

      {/* Main Single Screen: Dashboard */}
      {screenView === 'dashboard' && (
        <div className="flex-1 flex flex-col h-full max-h-screen overflow-hidden">
          {/* FIXED NON-SCROLLABLE TOP SECTION (Header + Overview Card + Big Add Goal Button) */}
          <div className="shrink-0 bg-surface z-30">
            {/* Dashboard Header Bar (Add Goal removed from top right) */}
            <header className="border-b border-outline-variant/20 px-4 py-3 shrink-0 flex items-center justify-between gap-2">
              {/* Brand Logo & Title */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary to-primary-container text-on-primary flex items-center justify-center font-black text-xs shadow-xs">
                  OG
                </div>
                <div>
                  <span className="text-base font-black tracking-tight text-on-surface block leading-none">
                    OrbitGoals
                  </span>
                  <span className="text-[11px] font-semibold text-on-surface-variant block mt-0.5">
                    Daily Goals & Milestones
                  </span>
                </div>
              </div>

              {/* Action Icons in Header: Goals, Calendar Heat Zone, Settings */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Goals Full Screen Launcher */}
                <button
                  onClick={() => setScreenView('goals')}
                  className="h-9 px-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer flex items-center gap-1 border border-outline-variant/30 font-bold text-xs"
                  title="Open Goals"
                >
                  <Target className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                  <span>Goals</span>
                </button>

                {/* Calendar Heat Zone Launcher */}
                <button
                  onClick={() => handleOpenCalendar()}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
                  title="Open Goals Heat Zone Calendar"
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

            {/* Overview Card & Big Add Goal Button (Anchored above list, does NOT scroll) */}
            <div className="px-4 pt-3 pb-2 space-y-2.5">
              {/* Daily Goals Progress Overview Card */}
              <div className="bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low rounded-2xl p-3.5 border border-outline-variant/30 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    Today's Goals Overview
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-bold">
                    {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <h2 className="text-lg font-black text-on-surface tracking-tight leading-tight truncate">
                      {totalGoals === 0
                        ? 'No Goals Yet'
                        : todayPct === 100
                        ? 'All Goals Completed! 🎉'
                        : `${uncompletedCount} Goal${uncompletedCount === 1 ? '' : 's'} Remaining`}
                    </h2>
                    <p className="text-[11px] text-on-surface-variant font-medium truncate">
                      {totalGoals === 0
                        ? 'Tap Add Goal below to start.'
                        : `${completedTodayCount} of ${totalGoals} goals finished today.`}
                    </p>
                  </div>

                  {/* Circular Completion Ring */}
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
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
                        strokeDasharray={`${todayPct}, 100`}
                        strokeLinecap="round"
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xs font-black text-on-surface font-mono tabular-nums leading-none">
                        {todayPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BIG PROPERLY VISIBLE "ADD GOAL" BUTTON (Opens Add Goal Tab) */}
              <button
                onClick={() => setScreenView('add-goal')}
                className="w-full py-3.5 px-5 rounded-2xl bg-primary text-on-primary font-black text-sm shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[50px]"
              >
                <div className="w-6 h-6 rounded-full bg-on-primary/15 flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[3] text-on-primary" />
                </div>
                <span>Add Goal</span>
              </button>

              {/* List Header Label */}
              <div className="flex items-center justify-between px-1 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Active Goals ({goals.length})
                </h3>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  Tap - / + to update
                </span>
              </div>
            </div>
          </div>

          {/* ONLY THIS GOALS LIST IS SCROLLABLE */}
          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
            {goals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

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
                      <span className="text-sm font-bold text-on-surface truncate">
                        {goal.title}
                      </span>
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
                        disabled={goal.currentValue <= 0}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface text-red-500 hover:bg-surface-container-high font-bold active:scale-95 transition-all border border-outline-variant/20 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Subtract 1 unit (-1)"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      {/* Plus button to add 1 unit */}
                      <button
                        onClick={() => handleUpdateGoalValue(goal.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface text-primary hover:bg-surface-container-high font-bold active:scale-95 transition-all border border-outline-variant/20 cursor-pointer"
                        title="Add 1 unit (+1)"
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

                  {/* Second Row: Fits perfectly in one line without stacking */}
                  <div className="flex items-center justify-between gap-2 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[11px] tabular-nums shrink-0">
                        {pct}% Complete
                      </span>

                      <span className="font-mono tabular-nums text-on-surface font-semibold text-xs truncate">
                        {goal.category === 'finance' ? settings.currency : ''}
                        {goal.currentValue.toLocaleString()} / {goal.category === 'finance' ? settings.currency : ''}
                        {goal.targetValue.toLocaleString()} {goal.unit}
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
              <div className="text-center py-12 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <ListTodo className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-on-surface">No goals yet</h4>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                  Tap the big "Add Goal" button above to create your first goal.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </AndroidFrame>
  );
}
