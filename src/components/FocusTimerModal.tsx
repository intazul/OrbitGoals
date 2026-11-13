import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Habit, Goal } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { fireConfetti } from '../utils/confetti';
import { X, Play, Pause, RotateCcw, Timer, Check, Zap, Repeat, Target } from 'lucide-react';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  goals: Goal[];
  onCompleteSession: (payload: {
    minutes: number;
    xpEarned: number;
    linkedHabitId?: string;
    linkedGoalId?: string;
  }) => void;
}

const PRESET_DURATIONS = [
  { minutes: 15, label: '15m Sprint', xp: 20 },
  { minutes: 25, label: '25m Focus', xp: 35 },
  { minutes: 45, label: '45m Deep', xp: 65 },
  { minutes: 60, label: '60m Flow', xp: 90 },
];

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  habits,
  goals,
  onCompleteSession,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [linkedType, setLinkedType] = useState<'none' | 'habit' | 'goal'>('none');
  const [linkedId, setLinkedId] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = selectedMinutes * 60;
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft);
  const progressPct = totalSeconds > 0 ? Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100)) : 0;
  const xpReward =
    PRESET_DURATIONS.find((p) => p.minutes === selectedMinutes)?.xp ||
    Math.max(15, Math.round(selectedMinutes * 1.4));

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          setIsCompleted(true);
          sound.playLevelUp();
          triggerHaptic('success');
          fireConfetti(2200);
          onCompleteSession({
            minutes: selectedMinutes,
            xpEarned: xpReward,
            linkedHabitId: linkedType === 'habit' && linkedId ? linkedId : undefined,
            linkedGoalId: linkedType === 'goal' && linkedId ? linkedId : undefined,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, selectedMinutes, xpReward, linkedType, linkedId, onCompleteSession]);

  const handleSelectDuration = (mins: number) => {
    if (isRunning) return;
    setSelectedMinutes(mins);
    setSecondsLeft(mins * 60);
    setIsCompleted(false);
    sound.playPop();
    triggerHaptic('light');
  };

  const handleToggleRun = () => {
    if (isCompleted) {
      setSecondsLeft(selectedMinutes * 60);
      setIsCompleted(false);
    }
    setIsRunning((prev) => !prev);
    sound.playPop();
    triggerHaptic('medium');
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setSecondsLeft(selectedMinutes * 60);
    sound.playPop();
    triggerHaptic('light');
  };

  const handleInstantFinishTest = () => {
    setIsRunning(false);
    setSecondsLeft(0);
    setIsCompleted(true);
    sound.playSuccessChime();
    triggerHaptic('success');
    fireConfetti(1800);
    onCompleteSession({
      minutes: selectedMinutes,
      xpEarned: xpReward,
      linkedHabitId: linkedType === 'habit' && linkedId ? linkedId : undefined,
      linkedGoalId: linkedType === 'goal' && linkedId ? linkedId : undefined,
    });
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const circumference = 2 * Math.PI * 44; // ~276.46

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] max-h-[90vh] overflow-y-auto bg-surface text-on-surface rounded-t-3xl sm:rounded-3xl border border-outline-variant/40 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3.5 border-b border-outline-variant/25 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                  <Timer className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-on-surface leading-none">
                    Deep Focus Studio
                  </h2>
                  <p className="text-[11px] text-on-surface-variant font-medium mt-1">
                    Monochrome Pomodoro · +{xpReward} XP on completion
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  sound.playPop();
                }}
                className="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center cursor-pointer active:scale-95 transition-all border border-outline-variant/30"
                title="Close Focus Studio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Timer Body */}
            <div className="p-5 space-y-5">
              {/* Circular Monochrome Countdown Gauge */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-52 h-52 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      className="text-surface-container-highest"
                      strokeWidth="5"
                      stroke="currentColor"
                      fill="none"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="44"
                      className="text-primary"
                      strokeWidth="5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      strokeDasharray={circumference}
                      animate={{
                        strokeDashoffset: circumference * (1 - progressPct / 100),
                      }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-1">
                      {isCompleted ? 'Session Complete' : isRunning ? 'Focusing' : 'Ready'}
                    </span>
                    <span className="text-4xl font-black font-mono tabular-nums tracking-tight text-on-surface">
                      {mm}:{ss}
                    </span>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono font-bold text-on-surface-variant">
                      <Zap className="w-3 h-3 fill-current text-primary" />
                      <span>+{xpReward} XP</span>
                      <span>·</span>
                      <span>{progressPct}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={handleToggleRun}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-primary text-on-primary font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:opacity-90"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause Session</span>
                    </>
                  ) : isCompleted ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Run Again</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Focus</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={handleReset}
                  className="w-12 h-12 rounded-2xl bg-surface-container text-on-surface border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-high cursor-pointer transition-all"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Duration Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                  Session Duration
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESET_DURATIONS.map((preset) => {
                    const active = selectedMinutes === preset.minutes;
                    return (
                      <button
                        key={preset.minutes}
                        type="button"
                        disabled={isRunning}
                        onClick={() => handleSelectDuration(preset.minutes)}
                        className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border transition-all text-center cursor-pointer disabled:opacity-50 ${
                          active
                            ? 'bg-primary text-on-primary border-primary shadow-xs'
                            : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="font-mono font-black">{preset.minutes}m</div>
                        <div className="text-[9px] opacity-75">+{preset.xp} XP</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Link to Habit or Goal */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/25">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Link Session Progress
                  </span>
                  <div className="flex items-center gap-1">
                    {(['none', 'habit', 'goal'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setLinkedType(t);
                          if (t === 'habit' && habits.length > 0) setLinkedId(habits[0].id);
                          else if (t === 'goal' && goals.length > 0) setLinkedId(goals[0].id);
                          else setLinkedId('');
                          sound.playPop();
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize cursor-pointer transition-all ${
                          linkedType === t
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {linkedType === 'habit' && (
                  <div className="pt-1 flex items-center gap-2">
                    <Repeat className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                    <select
                      value={linkedId}
                      onChange={(e) => setLinkedId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-surface border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
                    >
                      {habits.length === 0 && <option value="">No habits available</option>}
                      {habits.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {linkedType === 'goal' && (
                  <div className="pt-1 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                    <select
                      value={linkedId}
                      onChange={(e) => setLinkedId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-surface border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
                    >
                      {goals.length === 0 && <option value="">No goals available</option>}
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {linkedType === 'none' && (
                  <p className="text-[11px] text-on-surface-variant">
                    Awards pure Focus XP on completion, or link a habit/goal to auto-advance it.
                  </p>
                )}
              </div>

              {elapsedSeconds >= 10 && !isCompleted && (
                <button
                  type="button"
                  onClick={handleInstantFinishTest}
                  className="w-full py-2.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container-high flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete Session Early & Claim +{xpReward} XP</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
