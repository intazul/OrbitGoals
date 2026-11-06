/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Habit, Goal } from '../types';
import { usePedometer } from '../hooks/usePedometer';
import {
  ArrowLeft,
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
  Calendar,
  Clock,
  TrendingUp,
  Target,
  ChevronRight,
  Info,
  Scale,
  Ruler,
  Award,
} from 'lucide-react';
import { sound, triggerHaptic } from '../utils/sound';

interface StepAnalyticsScreenProps {
  onBack: () => void;
  habits: Habit[];
  goals: Goal[];
  onSyncStepsToHabits: (steps: number) => void;
}

export const StepAnalyticsScreen: React.FC<StepAnalyticsScreenProps> = ({
  onBack,
  habits,
  goals,
  onSyncStepsToHabits,
}) => {
  const {
    state,
    isSimulating,
    toggleTracking,
    toggleWalkingMode,
    simulateStep,
    toggleAutoWalk,
    setSensitivity,
    setDailyGoal,
    setStrideLength,
    setBodyWeight,
    getWeeklyHistory,
    requestPermission,
    resetTodaySteps,
  } = usePedometer();

  // Local UI state
  const [activeGraphTab, setActiveGraphTab] = useState<'hourly' | 'weekly'>('hourly');
  const [syncedNotice, setSyncedNotice] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Target editing state
  const [customGoalInput, setCustomGoalInput] = useState<string>(String(state.dailyGoal));
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  // Stride & Weight local calibration state
  const currentStride = state.strideLengthCm ?? 74;
  const currentWeight = state.bodyWeightKg ?? 70;

  // Weekly history data
  const weeklyHistory = useMemo(() => getWeeklyHistory(), [state.stepsToday, state.dailyGoal]);

  // Hourly distribution data (24 hours)
  const hourlyData = useMemo(() => {
    return state.hourlySteps && state.hourlySteps.length === 24
      ? state.hourlySteps
      : new Array(24).fill(0);
  }, [state.hourlySteps, state.stepsToday]);

  const maxHourlySteps = useMemo(() => {
    const m = Math.max(...hourlyData, 10);
    return Math.max(m, 100);
  }, [hourlyData]);

  const peakHourIndex = useMemo(() => {
    let maxIdx = 0;
    let maxVal = 0;
    hourlyData.forEach((val, idx) => {
      if (val > maxVal) {
        maxVal = val;
        maxIdx = idx;
      }
    });
    return maxVal > 0 ? maxIdx : new Date().getHours();
  }, [hourlyData]);

  // Total weekly steps & average
  const weeklyTotalSteps = useMemo(() => {
    return weeklyHistory.reduce((sum, d) => sum + d.steps, 0);
  }, [weeklyHistory]);

  const weeklyAverage = Math.round(weeklyTotalSteps / 7);
  const daysGoalMet = weeklyHistory.filter((d) => d.steps >= d.goal).length;

  const pct = Math.min(100, Math.round((state.stepsToday / (state.dailyGoal || 10000)) * 100));

  // Determine active gait status
  let gaitStatus = state.isWalkingMode
    ? 'Walking Mode: Active (Waiting for steps)'
    : 'Walking Mode: OFF (Idle)';
  let gaitBadgeColor = state.isWalkingMode
    ? 'bg-surface-container text-on-surface border-outline-variant/40'
    : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20';

  if (state.isWalkingMode) {
    if (state.cadence > 130) {
      gaitStatus = '⚡ Fast Pace / Running';
      gaitBadgeColor = 'bg-primary text-on-primary border-primary';
    } else if (state.cadence > 85) {
      gaitStatus = '👟 Brisk Walking';
      gaitBadgeColor = 'bg-surface-container-highest text-on-surface border-outline-variant/50';
    } else if (state.cadence > 25) {
      gaitStatus = '🚶 Steady Walking';
      gaitBadgeColor = 'bg-surface text-on-surface border-outline-variant/40';
    }
  }

  // Find step-related habits and goals
  const stepHabits = habits.filter(
    (h) =>
      h.unit?.toLowerCase() === 'steps' ||
      h.title.toLowerCase().includes('step') ||
      h.title.toLowerCase().includes('walk')
  );
  const stepGoals = goals.filter(
    (g) =>
      g.unit?.toLowerCase() === 'steps' ||
      g.title.toLowerCase().includes('step') ||
      g.title.toLowerCase().includes('walk')
  );

  const handleSyncNow = () => {
    onSyncStepsToHabits(state.stepsToday);
    sound.playSuccessChime();
    triggerHaptic('success');
    setSyncedNotice(`Successfully synced ${state.stepsToday.toLocaleString()} steps!`);
    setTimeout(() => setSyncedNotice(null), 3500);
  };

  const handleSaveCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customGoalInput, 10);
    if (!isNaN(val) && val >= 500 && val <= 100000) {
      setDailyGoal(val);
      setIsEditingGoal(false);
      sound.playSuccessChime();
      triggerHaptic('medium');
    }
  };

  const handlePresetGoal = (preset: number) => {
    setDailyGoal(preset);
    setCustomGoalInput(String(preset));
    setIsEditingGoal(false);
    sound.playPop();
    triggerHaptic('light');
  };

  const handleAdjustStride = (delta: number) => {
    const next = Math.max(40, Math.min(130, currentStride + delta));
    setStrideLength(next);
    sound.playPop();
    triggerHaptic('light');
  };

  const handleAdjustWeight = (delta: number) => {
    const next = Math.max(30, Math.min(200, currentWeight + delta));
    setBodyWeight(next);
    sound.playPop();
    triggerHaptic('light');
  };

  const currentHour = new Date().getHours();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface text-on-surface">
      {/* Sticky Header Bar */}
      <header
        style={{ marginTop: '32px', marginLeft: '0px' }}
        className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 px-4 mt-8 pt-6 pb-3 shrink-0 flex items-center justify-between gap-2"
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 py-2 px-3 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer font-bold text-xs min-h-[40px] border border-outline-variant/30"
        >
          <ArrowLeft className="w-4 h-4 text-primary stroke-[2.5]" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold shadow-xs shrink-0">
            <Footprints className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-on-surface tracking-tight leading-none truncate">
              Step Analytics & Tracker
            </h1>
            <span className="text-[10px] text-on-surface-variant font-medium">
              Hardware Sensor & Calibration
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncNow}
          className="py-1.5 px-2.5 rounded-xl bg-primary text-on-primary font-black text-xs flex items-center gap-1 shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Sync steps to habits"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Sync</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-4 pt-3 pb-24 space-y-4 overflow-y-auto">
        {/* Synced Notification Banner */}
        {syncedNotice && (
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/30 text-on-surface text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 stroke-[3] text-primary" />
            <span>{syncedNotice}</span>
          </div>
        )}

        {/* Dedicated Walking Mode Switch & Live Sensor Status Card */}
        <div className={`p-4 rounded-3xl border transition-all ${
          state.isWalkingMode
            ? 'bg-surface-container border-primary/40 shadow-sm'
            : 'bg-surface-container-low border-outline-variant/30'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex h-3.5 w-3.5 shrink-0">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    state.isWalkingMode ? 'animate-ping bg-primary opacity-75' : 'bg-transparent'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                    state.isWalkingMode ? 'bg-primary' : 'bg-on-surface-variant/40'
                  }`}
                />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-on-surface text-sm block leading-tight truncate">
                    {state.isWalkingMode ? 'Walking Mode: Active' : 'Walking Mode: OFF (Idle)'}
                  </span>
                  {state.isWalkingMode && typeof state.liveIntensity === 'number' && state.liveIntensity > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-surface border border-outline-variant/40 text-on-surface shrink-0">
                      {state.liveIntensity} m/s²
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-on-surface-variant block mt-0.5 leading-tight">
                  {state.isWalkingMode
                    ? 'Counting physical footsteps · Auto-filters table vibrations'
                    : 'Pedometer does not count automatically · Switch ON when walking'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                toggleWalkingMode();
                sound.playPop();
                triggerHaptic('medium');
              }}
              className={`px-3.5 py-2 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
                state.isWalkingMode
                  ? 'bg-surface border border-outline-variant/40 text-on-surface hover:bg-surface-container-high'
                  : 'bg-primary text-on-primary hover:brightness-105 shadow-md'
              }`}
            >
              {state.isWalkingMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{state.isWalkingMode ? 'Turn OFF' : 'Switch ON'}</span>
            </button>
          </div>
        </div>

        {/* Hero Gauge & Today's Analytics Readout */}
        <div className="p-5 rounded-3xl bg-surface-container border border-outline-variant/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Circular SVG Gauge - Big & Prominent */}
          <div className="relative w-60 h-60 xs:w-64 xs:h-64 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="text-surface-container-highest"
                strokeWidth="8"
                stroke="currentColor"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className="text-primary transition-all duration-700 ease-out"
                strokeDasharray={`${(pct / 100) * 276.46}, 276.46`}
                strokeLinecap="round"
                strokeWidth="8"
                stroke="currentColor"
                fill="none"
              />
            </svg>

            {/* Gauge Core Content */}
            <div className="absolute flex flex-col items-center justify-center px-4">
              <Footprints className="w-7 h-7 text-primary mb-1.5 animate-pulse" />
              <span className="text-4xl xs:text-5xl font-black font-mono tracking-tight text-on-surface leading-none tabular-nums">
                {state.stepsToday.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-on-surface-variant mt-2 font-mono">
                / {state.dailyGoal.toLocaleString()} steps
              </span>
              <span
                style={{ width: '134.8125px', height: '21px', fontSize: '11px' }}
                className="font-black text-primary bg-primary/10 px-3 py-0.5 rounded-full mt-2.5 border border-primary/20 flex items-center justify-center text-[11px]"
              >
                {pct}% Goal Achieved
              </span>
            </div>
          </div>

          {/* Gait Status Badge */}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${gaitBadgeColor}`}
            >
              <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{gaitStatus}</span>
              {state.cadence > 0 && (
                <span className="font-mono font-black ml-1">({state.cadence} SPM)</span>
              )}
            </span>
          </div>

          {/* Calibrated Tri-Metrics Grid: Distance, Calories, Active Cadence */}
          <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-outline-variant/20">
            <div className="p-2.5 rounded-2xl bg-surface border border-outline-variant/20 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Distance
              </span>
              <span className="text-sm font-black font-mono text-primary tabular-nums block leading-tight">
                {state.distanceKm} <span className="text-[10px] font-normal">km</span>
              </span>
              <span className="text-[9px] text-on-surface-variant font-mono">
                {(state.distanceKm * 0.621371).toFixed(2)} mi
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-surface border border-outline-variant/20 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Calories
              </span>
              <span className="text-sm font-black font-mono text-on-surface tabular-nums block leading-tight">
                {state.caloriesBurned} <span className="text-[10px] font-normal">kcal</span>
              </span>
              <span className="text-[9px] text-on-surface-variant font-mono">
                {currentWeight}kg calibrated
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-surface border border-outline-variant/20 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Cadence
              </span>
              <span className="text-sm font-black font-mono text-on-surface tabular-nums block leading-tight">
                {state.cadence} <span className="text-[10px] font-normal">SPM</span>
              </span>
              <span className="text-[9px] text-on-surface-variant font-mono">
                steps / min
              </span>
            </div>
          </div>
        </div>

        {/* Graphical Presentation Section: 24h Hourly Distribution vs 7-Day Weekly Trend */}
        <div className="p-4 rounded-3xl bg-surface-container border border-outline-variant/30 space-y-3.5">
          {/* Segmented Tab Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-outline-variant/30">
              <button
                type="button"
                onClick={() => {
                  setActiveGraphTab('hourly');
                  sound.playPop();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  activeGraphTab === 'hourly'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>24h Hourly</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveGraphTab('weekly');
                  sound.playPop();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  activeGraphTab === 'weekly'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>7-Day Trend</span>
              </button>
            </div>

            {/* Insight Badge */}
            <span className="text-[10px] font-bold text-on-surface-variant">
              {activeGraphTab === 'hourly'
                ? `Peak: ${peakHourIndex % 12 || 12}:00 ${peakHourIndex >= 12 ? 'PM' : 'AM'}`
                : `${daysGoalMet}/7 Goals Hit`}
            </span>
          </div>

          {/* VIEW 1: 24-Hour Distribution Bar Chart */}
          {activeGraphTab === 'hourly' && (
            <div className="space-y-2">
              <div className="h-36 w-full pt-3 flex items-end justify-between gap-1 border-b border-outline-variant/30 pb-2">
                {hourlyData.map((steps, hour) => {
                  const barHeightPct = Math.max(4, Math.round((steps / maxHourlySteps) * 100));
                  const isCurrent = hour === currentHour;
                  const isPeak = hour === peakHourIndex && steps > 0;
                  const isSelected = selectedHour === hour;

                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => {
                        setSelectedHour(isSelected ? null : hour);
                        sound.playPop();
                      }}
                      className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer relative"
                      title={`${hour}:00 - ${steps.toLocaleString()} steps`}
                    >
                      {/* Bar Pillar */}
                      <div
                        className={`w-full rounded-t transition-all duration-200 ${
                          isSelected
                            ? 'bg-primary ring-2 ring-primary ring-offset-1'
                            : isCurrent
                            ? 'bg-primary shadow-xs'
                            : isPeak
                            ? 'bg-on-surface'
                            : steps > 0
                            ? 'bg-on-surface-variant/80'
                            : 'bg-surface-container-highest/60 hover:bg-surface-container-highest'
                        }`}
                        style={{ height: `${barHeightPct}%` }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Hour X-Axis Labels */}
              <div className="flex justify-between text-[9px] font-mono text-on-surface-variant px-0.5">
                <span>12 AM</span>
                <span>4 AM</span>
                <span>8 AM</span>
                <span>12 PM</span>
                <span>4 PM</span>
                <span>8 PM</span>
                <span>11 PM</span>
              </div>

              {/* Selected Hour Detail Banner */}
              <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/30 flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">
                  {selectedHour !== null ? (
                    <>
                      Time:{' '}
                      <strong className="text-on-surface">
                        {selectedHour % 12 || 12}:00 {selectedHour >= 12 ? 'PM' : 'AM'}
                      </strong>
                    </>
                  ) : (
                    <>
                      Current Hour:{' '}
                      <strong className="text-on-surface">
                        {currentHour % 12 || 12}:00 {currentHour >= 12 ? 'PM' : 'AM'}
                      </strong>
                    </>
                  )}
                </span>
                <span className="font-mono font-black text-primary">
                  {(selectedHour !== null
                    ? hourlyData[selectedHour]
                    : hourlyData[currentHour] || 0
                  ).toLocaleString()}{' '}
                  steps
                </span>
              </div>
            </div>
          )}

          {/* VIEW 2: 7-Day Weekly Trend Chart */}
          {activeGraphTab === 'weekly' && (
            <div className="space-y-2">
              <div className="h-36 w-full pt-3 flex items-end justify-between gap-2 border-b border-outline-variant/30 pb-2 relative">
                {/* Horizontal Goal Target Line */}
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-primary/50 pointer-events-none z-10 flex items-center justify-end pr-1"
                  style={{ bottom: '55%' }}
                >
                  <span className="text-[8px] font-mono font-bold text-primary bg-surface/90 px-1 rounded -translate-y-2">
                    Target: {state.dailyGoal.toLocaleString()}
                  </span>
                </div>

                {weeklyHistory.map((item, idx) => {
                  const maxWeeklyStep = Math.max(...weeklyHistory.map((w) => w.steps), state.dailyGoal, 1000);
                  const barHeightPct = Math.max(6, Math.min(100, Math.round((item.steps / maxWeeklyStep) * 100)));
                  const isToday = idx === weeklyHistory.length - 1;

                  return (
                    <div
                      key={item.date}
                      className="flex-1 h-full flex flex-col items-center justify-end relative group"
                    >
                      {/* Step count tooltip on hover */}
                      <span className="text-[8px] font-mono font-bold text-on-surface-variant mb-1 group-hover:text-primary transition-colors">
                        {(item.steps / 1000).toFixed(1)}k
                      </span>

                      {/* Bar Column */}
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          item.completed
                            ? 'bg-primary shadow-xs'
                            : isToday
                            ? 'bg-on-surface'
                            : 'bg-surface-container-highest'
                        }`}
                        style={{ height: `${barHeightPct}%` }}
                      />

                      {/* Day Label */}
                      <span
                        className={`text-[10px] font-bold mt-1.5 ${
                          isToday ? 'text-primary font-black underline' : 'text-on-surface-variant'
                        }`}
                      >
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Weekly Statistics Summary */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-surface border border-outline-variant/20">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase block">
                    7-Day Total
                  </span>
                  <span className="text-xs font-black font-mono text-on-surface">
                    {weeklyTotalSteps.toLocaleString()}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-surface border border-outline-variant/20">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase block">
                    Daily Average
                  </span>
                  <span className="text-xs font-black font-mono text-primary">
                    {weeklyAverage.toLocaleString()}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-surface border border-outline-variant/20">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase block">
                    Consistency
                  </span>
                  <span className="text-xs font-black font-mono text-on-surface">
                    {Math.round((daysGoalMet / 7) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TARGET & CALIBRATION ENGINE ("edit it's target and everything") */}
        <div className="p-4 rounded-3xl bg-surface-container border border-outline-variant/30 space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black text-on-surface">
                Target & Calibration Settings
              </h3>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Live Engine
            </span>
          </div>

          {/* Section A: Daily Step Target Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">Daily Step Target</span>
              <span className="text-xs font-mono font-black text-primary">
                {state.dailyGoal.toLocaleString()} steps
              </span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-5 gap-1.5">
              {[5000, 8000, 10000, 12000, 15000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetGoal(preset)}
                  className={`py-1.5 rounded-xl text-[10px] font-bold transition-all border text-center cursor-pointer ${
                    state.dailyGoal === preset
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {preset / 1000}k
                </button>
              ))}
            </div>

            {/* Custom Target Input */}
            <form onSubmit={handleSaveCustomGoal} className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="500"
                max="100000"
                step="500"
                value={customGoalInput}
                onChange={(e) => setCustomGoalInput(e.target.value)}
                placeholder="Custom goal"
                className="flex-1 py-1.5 px-3 rounded-xl bg-surface border border-outline-variant/40 text-on-surface font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="py-1.5 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                Save Target
              </button>
            </form>
          </div>

          {/* Section B: Stride Length Calibration */}
          <div className="p-3 rounded-2xl bg-surface border border-outline-variant/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-primary" />
                <span>Stride Length Calibration</span>
              </span>
              <span className="text-xs font-mono font-black text-primary">
                {currentStride} cm (~{(currentStride * 0.393701).toFixed(1)} in)
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant">
              Determines real distance calculation from physical footsteps. Average is 70–78 cm.
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAdjustStride(-2)}
                className="py-1 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-black text-xs hover:bg-surface-container-high cursor-pointer active:scale-95"
              >
                -2 cm
              </button>
              <div className="flex-1 text-center font-mono text-xs font-black text-on-surface">
                {currentStride} cm
              </div>
              <button
                type="button"
                onClick={() => handleAdjustStride(2)}
                className="py-1 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-black text-xs hover:bg-surface-container-high cursor-pointer active:scale-95"
              >
                +2 cm
              </button>
            </div>
          </div>

          {/* Section C: Body Weight Calibration (Calorie Accuracy) */}
          <div className="p-3 rounded-2xl bg-surface border border-outline-variant/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-primary" />
                <span>Body Weight Calibration</span>
              </span>
              <span className="text-xs font-mono font-black text-primary">
                {currentWeight} kg (~{Math.round(currentWeight * 2.20462)} lbs)
              </span>
            </div>
            <p className="text-[10px] text-on-surface-variant">
              Accurately scales active metabolic caloric expenditure per human stride.
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleAdjustWeight(-1)}
                className="py-1 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-black text-xs hover:bg-surface-container-high cursor-pointer active:scale-95"
              >
                -1 kg
              </button>
              <div className="flex-1 text-center font-mono text-xs font-black text-on-surface">
                {currentWeight} kg
              </div>
              <button
                type="button"
                onClick={() => handleAdjustWeight(1)}
                className="py-1 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-black text-xs hover:bg-surface-container-high cursor-pointer active:scale-95"
              >
                +1 kg
              </button>
            </div>
          </div>

          {/* Section D: Sensor Sensitivity Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                <span>Accelerometer Impact Filter</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface border border-outline-variant/30 text-on-surface">
                {state.sensitivity === 'normal'
                  ? 'Normal (2.45 m/s²)'
                  : state.sensitivity === 'high'
                  ? 'Sensitive (1.85 m/s²)'
                  : 'Firm Walk (3.30 m/s²)'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['high', 'normal', 'low'] as const).map((sens) => (
                <button
                  key={sens}
                  type="button"
                  onClick={() => {
                    setSensitivity(sens);
                    sound.playPop();
                  }}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all border text-center cursor-pointer capitalize ${
                    state.sensitivity === sens
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {sens === 'high' ? '🚶 Light Walk' : sens === 'normal' ? '👟 Normal (Walk)' : '🏃 Firm (Jog)'}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Calibrated strictly for real human walking. Requires continuous rhythmic strides (3-step gait buffer) before logging, automatically ignoring desk vibrations, phone handling, and typing.
            </p>
          </div>

          {/* Section E: Manual Simulation & Testing Controls */}
          <div className="p-3 rounded-2xl bg-surface border border-outline-variant/20 space-y-2.5">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Step Testing & Simulation Tools</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  simulateStep();
                  sound.playPop();
                  triggerHaptic('light');
                }}
                className="py-2.5 px-3 rounded-xl bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Footprints className="w-3.5 h-3.5 text-primary" />
                <span>+1 Test Step</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  toggleAutoWalk();
                  sound.playPop();
                  triggerHaptic('medium');
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border ${
                  isSimulating
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Stop Auto-Walk' : 'Auto-Walk Demo'}</span>
              </button>
            </div>
          </div>

          {/* iOS Permission Prompt if required */}
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
                className="w-full py-2.5 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Grant iOS Motion Sensor Access</span>
              </button>
            )}

          {/* Reset Today's Steps */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Reset today's step counter and hourly log to 0?")) {
                  resetTodaySteps();
                  sound.playPop();
                  triggerHaptic('medium');
                }
              }}
              className="py-1.5 px-3 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/50 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Today's Steps</span>
            </button>
          </div>
        </div>

        {/* Section: Connected Habits and Goals */}
        {(stepHabits.length > 0 || stepGoals.length > 0) && (
          <div className="p-4 rounded-3xl bg-surface-container border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-on-surface flex items-center gap-1.5">
                <Award className="w-4 h-4 text-primary" />
                <span>Connected Habits & Goals</span>
              </span>
              <span className="text-[10px] font-bold text-on-surface-variant">
                Auto-syncs on tap
              </span>
            </div>

            <div className="space-y-2">
              {stepHabits.map((habit) => {
                const target = habit.targetValue || 10000;
                return (
                  <div
                    key={habit.id}
                    className="p-3 rounded-2xl bg-surface border border-outline-variant/20 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{habit.icon}</span>
                      <div>
                        <span className="font-bold text-on-surface block leading-tight">
                          {habit.title}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          Target: {target.toLocaleString()} {habit.unit || 'steps'}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-primary text-xs">
                      {Math.min(target, state.stepsToday).toLocaleString()} / {target.toLocaleString()}
                    </span>
                  </div>
                );
              })}

              {stepGoals.map((goal) => {
                const target = goal.targetValue || 10000;
                return (
                  <div
                    key={goal.id}
                    className="p-3 rounded-2xl bg-surface border border-outline-variant/20 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{goal.icon}</span>
                      <div>
                        <span className="font-bold text-on-surface block leading-tight">
                          {goal.title}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          Target: {target.toLocaleString()} {goal.unit || 'steps'}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-primary text-xs">
                      {state.stepsToday.toLocaleString()} steps
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
