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
import { NewGoalModal } from './components/NewGoalModal';
import { GoalsScreen } from './components/GoalsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ToastContainer } from './components/ToastContainer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { GoalIcon } from './components/GoalIcon';

import {
  Check,
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

  // Screen View: 'dashboard' | 'goals' | 'settings'
  const [screenView, setScreenView] = useState<'dashboard' | 'goals' | 'settings'>('dashboard');
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);

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

  // Toggle goal completed today
  const handleToggleGoalToday = (goalId: string) => {
    let isNowCompleted = false;

    const newGoals = goals.map((goal) => {
      if (goal.id !== goalId) return goal;

      const completed = goal.completedDates.includes(todayStr);
      let updatedDates = [...goal.completedDates];

      if (completed) {
        updatedDates = updatedDates.filter((d) => d !== todayStr);
      } else {
        updatedDates.push(todayStr);
        isNowCompleted = true;
      }

      return {
        ...goal,
        completedDates: updatedDates,
      };
    });

    updateGoals(newGoals);
    triggerHaptic(isNowCompleted ? 'success' : 'light');

    if (isNowCompleted) {
      sound.playSuccessChime();
      const completedCount = newGoals.filter((g) => g.completedDates.includes(todayStr)).length;
      if (completedCount === newGoals.length && newGoals.length > 0) {
        fireConfetti(3000);
      }
    } else {
      sound.playPop();
    }
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

      return {
        ...goal,
        currentValue: newVal,
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

      {/* Full Screen Mode: Goals View */}
      {screenView === 'goals' && (
        <GoalsScreen
          goals={goals}
          onBack={() => setScreenView('dashboard')}
          onOpenNewGoal={() => setIsNewGoalOpen(true)}
          onUpdateGoalValue={handleUpdateGoalValue}
          onDeleteGoal={handleDeleteGoal}
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
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Dashboard Header Bar */}
          <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 px-4 py-3.5 transition-colors shrink-0 flex items-center justify-between gap-2">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-primary-container text-on-primary flex items-center justify-center font-black text-sm shadow-xs">
                OG
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-on-surface block leading-none">
                  OrbitGoals
                </span>
                <span className="text-xs font-semibold text-on-surface-variant block mt-1">
                  Daily Goals & Milestones
                </span>
              </div>
            </div>

            {/* Action Icons: Goals Full-Screen Icon, Settings Icon, + Add */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Goals Full Screen Launcher */}
              <button
                onClick={() => setScreenView('goals')}
                className="h-10 px-3 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-outline-variant/30 font-bold text-xs shadow-2xs"
                title="Open Goals"
              >
                <Target className="w-4 h-4 text-primary stroke-[2.5]" />
                <span>Goals</span>
              </button>

              {/* Settings Option Button */}
              <button
                onClick={() => setScreenView('settings')}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer border border-outline-variant/30 shadow-2xs"
                title="Open Settings"
              >
                <Settings className="w-4 h-4 text-primary" />
              </button>

              {/* Header Add Button */}
              <button
                onClick={() => setIsNewGoalOpen(true)}
                className="h-10 px-4 rounded-full bg-primary text-on-primary font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm hover:brightness-105"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add</span>
              </button>
            </div>
          </header>

          {/* Dashboard Body Content */}
          <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto">
            {/* Daily Goals Progress Overview Card */}
            <div className="bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low rounded-3xl p-5 border border-outline-variant/30 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  Today's Goals Overview
                </span>
                <span className="text-xs text-on-surface-variant font-bold">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-on-surface tracking-tight leading-tight">
                    {totalGoals === 0
                      ? 'No Goals Yet'
                      : todayPct === 100
                      ? 'All Goals Completed! 🎉'
                      : `${uncompletedCount} Goal${uncompletedCount === 1 ? '' : 's'} Remaining`}
                  </h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                    {totalGoals === 0
                      ? 'Tap the big Add Goal button below to get started.'
                      : todayPct === 100
                      ? 'All daily goals achieved today! Great job.'
                      : `${completedTodayCount} of ${totalGoals} goals completed today.`}
                  </p>
                </div>

                {/* Circular Completion Ring */}
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
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
                    <span className="text-sm font-black text-on-surface font-mono tabular-nums leading-none">
                      {todayPct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BIG PROPERLY VISIBLE "ADD GOAL" BUTTON */}
            <button
              onClick={() => setIsNewGoalOpen(true)}
              className="w-full py-4 px-6 rounded-2xl bg-primary text-on-primary font-black text-sm sm:text-base shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2.5 min-h-[56px]"
            >
              <div className="w-7 h-7 rounded-full bg-on-primary/15 flex items-center justify-center">
                <Plus className="w-5 h-5 stroke-[3] text-on-primary" />
              </div>
              <span>Add Goal</span>
            </button>

            {/* Goals Checklist */}
            <div className="space-y-3 pb-8">
              <div className="flex items-center justify-between px-1 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Active Goals Checklist ({goals.length})
                </h3>
                {goals.length > 0 && (
                  <span className="text-xs text-on-surface-variant font-medium">
                    Tap circle to check off
                  </span>
                )}
              </div>

              {goals.map((goal) => {
                const isDone = goal.completedDates.includes(todayStr);
                const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

                return (
                  <div
                    key={goal.id}
                    className={`rounded-3xl border transition-all duration-200 p-4 sm:p-5 shadow-xs space-y-3 ${
                      isDone
                        ? 'bg-surface-container-low/70 border-outline-variant/30 opacity-90'
                        : 'bg-surface-container-lowest border-outline-variant/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Large 48px touch hitbox for checking */}
                      <button
                        onClick={() => handleToggleGoalToday(goal.id)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer ${
                          isDone
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'border-2 border-outline hover:border-primary text-transparent'
                        }`}
                        title={isDone ? 'Mark incomplete' : 'Mark complete'}
                      >
                        <Check className="w-7 h-7 stroke-[3]" />
                      </button>

                      {/* Goal Title & Details with Custom Icon */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/20">
                            <GoalIcon iconId={goal.icon} className="w-3.5 h-3.5" color={goal.color} />
                          </div>
                          <h4
                            className={`text-base font-bold text-on-surface break-words leading-snug ${
                              isDone ? 'line-through text-on-surface-variant' : ''
                            }`}
                          >
                            {goal.title}
                          </h4>
                        </div>

                        {/* Target Complete in Percentage + Values + Frequency Badge */}
                        <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                          {/* Target complete percentage */}
                          <span className="font-mono font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg tabular-nums">
                            {pct}% Complete
                          </span>

                          <span className="font-mono tabular-nums text-on-surface font-bold">
                            {goal.category === 'finance' ? settings.currency : ''}
                            {goal.currentValue.toLocaleString()} / {goal.category === 'finance' ? settings.currency : ''}
                            {goal.targetValue.toLocaleString()} {goal.unit}
                          </span>

                          <span className="text-[11px] font-semibold text-on-surface-variant px-2 py-0.5 rounded-md bg-surface-container flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-primary" />
                            <span>{formatFrequency(goal)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions: - Minus (undo), + Plus, and Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Minus button to delete/subtract one if mistakenly added */}
                        <button
                          onClick={() => handleUpdateGoalValue(goal.id, -1)}
                          disabled={goal.currentValue <= 0}
                          className="w-10 h-10 flex items-center justify-center bg-surface-container rounded-2xl text-on-surface hover:bg-surface-container-high font-bold active:scale-95 cursor-pointer border border-outline-variant/30 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Subtract 1 unit (-1)"
                        >
                          <Minus className="w-4 h-4 stroke-[2.5] text-red-500" />
                        </button>

                        {/* Plus button to add 1 unit */}
                        <button
                          onClick={() => handleUpdateGoalValue(goal.id, 1)}
                          className="w-10 h-10 flex items-center justify-center bg-surface-container rounded-2xl text-on-surface hover:bg-surface-container-high font-bold active:scale-95 cursor-pointer border border-outline-variant/30"
                          title="Add +1 unit"
                        >
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                        </button>

                        {/* Delete goal button */}
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-red-500 rounded-xl hover:bg-surface-container active:scale-95 cursor-pointer"
                          title="Delete goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: goal.color }}
                      />
                    </div>
                  </div>
                );
              })}

              {goals.length === 0 && (
                <div className="text-center py-14 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40 p-6 space-y-3">
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
        </div>
      )}

      {/* Goal Creation Modal */}
      <NewGoalModal
        isOpen={isNewGoalOpen}
        onClose={() => setIsNewGoalOpen(false)}
        onSaveGoal={handleSaveGoal}
        currency={settings.currency}
      />
    </AndroidFrame>
  );
}
