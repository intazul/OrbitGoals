/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePedometer } from '../hooks/usePedometer';
import { Footprints, Flame, ChevronRight, Activity, Play, Pause, Sparkles } from 'lucide-react';
import { sound, triggerHaptic } from '../utils/sound';

interface PedometerWidgetProps {
  onOpenModal: () => void;
  onSyncSteps?: (steps: number) => void;
}

export const PedometerWidget: React.FC<PedometerWidgetProps> = ({
  onOpenModal,
  onSyncSteps,
}) => {
  const { state, toggleTracking } = usePedometer();

  const pct = Math.min(100, Math.round((state.stepsToday / (state.dailyGoal || 10000)) * 100));

  const handlePauseResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTracking();
    sound.playPop();
    triggerHaptic('light');
  };

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSyncSteps) {
      onSyncSteps(state.stepsToday);
      sound.playSuccessChime();
      triggerHaptic('success');
    }
  };

  return (
    <div
      onClick={onOpenModal}
      className="p-3.5 rounded-3xl bg-surface-container border border-outline-variant/60 shadow-xs hover:border-on-surface/40 transition-all cursor-pointer active:scale-[0.99] group space-y-2.5"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-black/10 dark:bg-blue-500/20 text-on-surface dark:text-blue-500 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform border border-outline-variant/30">
            <Footprints className="w-4 h-4 animate-pulse text-on-surface dark:text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-on-surface block leading-tight">
                Real Step Counter
              </span>
              {state.isTracking && typeof state.liveIntensity === 'number' && state.liveIntensity > 0 && (
                <span className="text-[8px] font-mono font-bold px-1 rounded bg-black/10 dark:bg-white/10 text-on-surface border border-outline-variant/40">
                  {state.liveIntensity} m/s²
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    state.isTracking ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    state.isTracking ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <span className="text-[10px] font-bold text-on-surface-variant font-mono">
                {state.isTracking ? (state.cadence > 0 ? `${state.cadence} SPM` : 'Sensor Active') : 'Paused'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onSyncSteps && state.stepsToday > 0 && (
            <button
              type="button"
              onClick={handleSync}
              className="px-2 py-1 rounded-lg bg-black/10 dark:bg-blue-500/15 hover:bg-black/20 text-on-surface dark:text-blue-400 font-bold text-[10px] flex items-center gap-1 border border-outline-variant/40 transition-all cursor-pointer"
              title="Sync current steps to linked habits"
            >
              <Sparkles className="w-3 h-3 text-on-surface dark:text-blue-400" />
              <span>Sync</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePauseResume}
            className="w-7 h-7 rounded-lg bg-surface border border-outline-variant/40 flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
            title={state.isTracking ? 'Pause step counting' : 'Resume step counting'}
          >
            {state.isTracking ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Middle Readout Row: Big Count + Circular Ring */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-black font-mono text-on-surface tracking-tight leading-none tabular-nums">
              {state.stepsToday.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-on-surface-variant font-mono">
              / {state.dailyGoal.toLocaleString()} steps
            </span>
          </div>

          <div className="flex items-center gap-2.5 pt-0.5 text-[11px] text-on-surface-variant font-mono">
            <span>{state.distanceKm} km</span>
            <span>·</span>
            <span className="text-on-surface font-bold flex items-center gap-0.5">
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{state.caloriesBurned} kcal</span>
            </span>
          </div>
        </div>

        {/* Circular Progress Ring */}
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
              className="text-on-surface dark:text-blue-500 transition-all duration-500 ease-out"
              strokeDasharray={`${pct}, 100`}
              strokeLinecap="round"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-[12px] font-black text-on-surface font-mono tabular-nums leading-none">
              {pct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
