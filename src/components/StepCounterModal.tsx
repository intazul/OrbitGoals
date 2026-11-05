/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePedometer } from '../hooks/usePedometer';
import {
  X,
  Footprints,
  Play,
  Pause,
  Flame,
  Gauge,
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  Check,
  ShieldCheck,
  Activity,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { sound, triggerHaptic } from '../utils/sound';
import { Habit, Goal } from '../types';

interface StepCounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  goals: Goal[];
  onSyncStepsToHabit: (stepCount: number) => void;
}

export const StepCounterModal: React.FC<StepCounterModalProps> = ({
  isOpen,
  onClose,
  habits,
  goals,
  onSyncStepsToHabit,
}) => {
  const {
    state,
    isSimulating,
    toggleTracking,
    simulateStep,
    toggleAutoWalk,
    setSensitivity,
    setDailyGoal,
    requestPermission,
    resetTodaySteps,
  } = usePedometer();

  const [syncedNotice, setSyncedNotice] = useState<string | null>(null);
  const [goalEditing, setGoalEditing] = useState<boolean>(false);
  const [tempGoal, setTempGoal] = useState<string>(String(state.dailyGoal));

  if (!isOpen) return null;

  const pct = Math.min(100, Math.round((state.stepsToday / (state.dailyGoal || 10000)) * 100));

  // Determine activity status label from cadence
  let activityLabel = 'Resting / Stationary';
  let activityColor = 'text-on-surface-variant';
  if (state.cadence > 130) {
    activityLabel = '⚡ Fast Pace / Running';
    activityColor = 'text-rose-500';
  } else if (state.cadence > 95) {
    activityLabel = '👟 Brisk Active Walking';
    activityColor = 'text-primary';
  } else if (state.cadence > 30) {
    activityLabel = '🚶 Steady Walking';
    activityColor = 'text-emerald-500';
  }

  // Find step-related habits and goals
  const stepHabits = habits.filter(
    (h) => h.unit?.toLowerCase() === 'steps' || h.title.toLowerCase().includes('step') || h.title.toLowerCase().includes('walk')
  );
  const stepGoals = goals.filter(
    (g) => g.unit?.toLowerCase() === 'steps' || g.title.toLowerCase().includes('step') || g.title.toLowerCase().includes('walk')
  );

  const handleManualStep = () => {
    simulateStep();
    sound.playPop();
    triggerHaptic('light');
  };

  const handleAutoWalkToggle = () => {
    toggleAutoWalk();
    sound.playPop();
    triggerHaptic('medium');
  };

  const handleSyncNow = () => {
    onSyncStepsToHabit(state.stepsToday);
    sound.playSuccessChime();
    triggerHaptic('success');
    setSyncedNotice(`Synced ${state.stepsToday.toLocaleString()} real steps to your habits!`);
    setTimeout(() => setSyncedNotice(null), 3500);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(tempGoal, 10);
    if (!isNaN(parsed) && parsed >= 500 && parsed <= 100000) {
      setDailyGoal(parsed);
      setGoalEditing(false);
      sound.playPop();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-[430px] max-h-[92vh] bg-surface text-on-surface rounded-t-3xl sm:rounded-3xl border border-outline-variant/30 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 pt-4 pb-3 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-xs">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-none text-on-surface">
                Real-Time Pedometer
              </h2>
              <span className="text-[10px] text-on-surface-variant font-medium">
                Hardware Accelerometer & Step Engine
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-all cursor-pointer border border-outline-variant/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Notification banner */}
          {syncedNotice && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 stroke-[3]" />
              <span>{syncedNotice}</span>
            </div>
          )}

          {/* Sensor Hardware Status Card */}
          <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    state.isTracking ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    state.isTracking ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <div className="min-w-0">
                <span className="font-bold text-on-surface block leading-tight truncate">
                  {state.isTracking ? 'Motion Sensor Active' : 'Pedometer Paused'}
                </span>
                <span className="text-[10px] text-on-surface-variant block truncate">
                  {state.isSensorSupported
                    ? 'Counting physical footsteps via 3D Accelerometer'
                    : 'Simulation & Manual Mode Enabled'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTracking}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs shrink-0 ${
                state.isTracking
                  ? 'bg-surface-container-highest text-on-surface border border-outline-variant/30 hover:bg-surface-container-high'
                  : 'bg-primary text-on-primary'
              }`}
            >
              {state.isTracking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{state.isTracking ? 'Pause' : 'Resume'}</span>
            </button>
          </div>

          {/* Large Circular Gauge & Step Counter Hero */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-500/10 via-primary/5 to-surface-container border border-blue-500/20 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Circular Gauge */}
            <div className="relative w-44 h-44 flex items-center justify-center my-1">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-surface-container-highest"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-primary transition-all duration-700 ease-out"
                  strokeDasharray={`${(pct / 100) * 263.89}, 263.89`}
                  strokeLinecap="round"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="none"
                />
              </svg>

              {/* Inside Gauge Readout */}
              <div className="absolute flex flex-col items-center justify-center">
                <Footprints className="w-6 h-6 text-primary mb-1 animate-pulse" />
                <span className="text-3xl font-black font-mono tracking-tight text-on-surface leading-none tabular-nums">
                  {state.stepsToday.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-on-surface-variant mt-1 font-mono">
                  / {state.dailyGoal.toLocaleString()} steps
                </span>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1.5 border border-primary/20">
                  {pct}% Completed
                </span>
              </div>
            </div>

            {/* Current Activity Dynamic State Pill */}
            <div className="mt-2 flex items-center gap-2 bg-surface/80 dark:bg-black/30 px-3 py-1 rounded-full border border-outline-variant/30 text-xs font-bold">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className={activityColor}>{activityLabel}</span>
              {state.cadence > 0 && (
                <span className="font-mono text-primary font-black ml-1">
                  ({state.cadence} SPM)
                </span>
              )}
            </div>
          </div>

          {/* Tri-Metric Cards: Distance, Calories, Pace */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/30 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Distance
              </span>
              <span className="text-base font-black font-mono text-primary tabular-nums block leading-tight">
                {state.distanceKm} <span className="text-xs font-normal">km</span>
              </span>
              <span className="text-[9px] text-on-surface-variant font-mono">
                {(state.distanceKm * 0.621371).toFixed(2)} mi
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/30 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Calories
              </span>
              <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums block leading-tight">
                {state.caloriesBurned} <span className="text-xs font-normal">kcal</span>
              </span>
              <span className="text-[9px] text-on-surface-variant font-mono">
                ~{(state.stepsToday * 0.04).toFixed(0)} burned
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/30 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Cadence
              </span>
              <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums block leading-tight">
                {state.cadence} <span className="text-xs font-normal">SPM</span>
              </span>
              <span className="text-[9px] text-on-surface-variant font-mono">
                steps / min
              </span>
            </div>
          </div>

          {/* One-Tap Sync to Habits & Goals Action */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-surface-container border border-primary/25 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-on-surface block leading-tight">
                  Sync Steps with Habits & Goals
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {stepHabits.length > 0 || stepGoals.length > 0
                    ? `Connected to ${stepHabits.length} habit(s) and ${stepGoals.length} goal(s)`
                    : 'Syncs live step progress directly into your daily routine'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSyncNow}
                className="py-2 px-3.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer hover:brightness-105"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sync Now</span>
              </button>
            </div>
          </div>

          {/* Sensitivity Calibration & iOS Sensor Permission */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Sensor Sensitivity</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant capitalize">
                {state.sensitivity} stride
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(['high', 'normal', 'low'] as const).map((sens) => (
                <button
                  key={sens}
                  type="button"
                  onClick={() => setSensitivity(sens)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all border text-center cursor-pointer capitalize ${
                    state.sensitivity === sens
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {sens === 'high' ? '⚡ High' : sens === 'normal' ? '🚶 Normal' : '🏃 Low (Run)'}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-on-surface-variant leading-tight">
              High: sensitive detection for gentle walks or pocket carry. Normal: standard walking stride. Low: outdoor jogging or rugged movement.
            </p>

            {/* iOS Motion Permission Trigger */}
            {typeof window !== 'undefined' &&
              typeof (window.DeviceMotionEvent as unknown as { requestPermission?: () => void })?.requestPermission === 'function' &&
              state.sensorPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={async () => {
                    const granted = await requestPermission();
                    if (granted) {
                      sound.playSuccessChime();
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Grant iOS Motion Sensor Access</span>
                </button>
              )}
          </div>

          {/* Test & Simulation Controls (Ideal for desktop testing or manual calibration) */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2.5">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-primary" />
              <span>Manual Test & Desktop Simulation</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleManualStep}
                className="py-2.5 px-3 rounded-xl bg-surface border border-outline-variant/30 hover:bg-surface-container text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Footprints className="w-3.5 h-3.5 text-primary" />
                <span>+1 Test Step</span>
              </button>

              <button
                type="button"
                onClick={handleAutoWalkToggle}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border ${
                  isSimulating
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Stop Auto-Walk' : 'Auto-Walk Demo'}</span>
              </button>
            </div>
          </div>

          {/* Daily Step Goal Setting & Reset */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {goalEditing ? (
              <form onSubmit={handleSaveGoal} className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="500"
                  max="100000"
                  step="500"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  className="w-24 py-1 px-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface font-mono text-xs font-bold focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-primary text-on-primary font-bold text-xs cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setGoalEditing(false)}
                  className="px-2 py-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setGoalEditing(true)}
                className="text-primary hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <span>Edit Goal ({state.dailyGoal.toLocaleString()})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm('Reset today’s step counter to 0?')) {
                  resetTodaySteps();
                  sound.playPop();
                }
              }}
              className="text-red-500 hover:text-red-600 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Steps</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
