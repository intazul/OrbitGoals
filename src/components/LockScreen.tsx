import React, { useState, useEffect } from 'react';
import { UserProfile, SecurityConfig } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import {
  Lock,
  ShieldCheck,
  Delete,
  KeyRound,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

interface LockScreenProps {
  profile: UserProfile;
  security: SecurityConfig;
  onUnlock: () => void;
  onUpdateSecurity: (updates: Partial<SecurityConfig>) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  profile,
  security,
  onUnlock,
  onUpdateSecurity,
}) => {
  const [pin, setPin] = useState<string>('');
  const [unlockSuccess, setUnlockSuccess] = useState<boolean>(false);
  const [errorShake, setErrorShake] = useState<boolean>(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // Handle keypad digit tap
  const handleDigitTap = (digit: string) => {
    if (pin.length >= 4 || unlockSuccess) return;

    sound.playLockTick();
    triggerHaptic('light');
    setErrorMessage(null);

    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === 4) {
      verifyPin(nextPin);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (pin.length === 0 || unlockSuccess) return;
    sound.playPop();
    triggerHaptic('light');
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  // Handle clear
  const handleClear = () => {
    if (pin.length === 0 || unlockSuccess) return;
    sound.playPop();
    triggerHaptic('light');
    setPin('');
    setErrorMessage(null);
  };

  // Verify PIN against stored security PIN with 3-attempt limit
  const verifyPin = (candidate: string) => {
    const targetPin = security.pin || '0000';

    if (candidate === targetPin) {
      setUnlockSuccess(true);
      setErrorMessage(null);
      setResetNotice(null);
      sound.playUnlock();
      triggerHaptic('success');
      setTimeout(() => {
        onUnlock();
      }, 350);
    } else {
      sound.playErrorTone();
      triggerHaptic('medium');
      setErrorShake(true);

      const nextAttempts = attemptsLeft - 1;

      if (nextAttempts <= 0) {
        // Reset to default passcode 0000 after 3 failed tries
        onUpdateSecurity({ pin: '0000' });
        setAttemptsLeft(3);
        setErrorMessage(null);
        setResetNotice('3 failed attempts. Passcode reset to default: 0000. Please enter 0000.');
        sound.playErrorTone();
        triggerHaptic('medium');
      } else {
        setAttemptsLeft(nextAttempts);
        setErrorMessage(
          `Incorrect passcode. ${nextAttempts} ${nextAttempts === 1 ? 'attempt' : 'attempts'} remaining.`
        );
      }

      setTimeout(() => {
        setErrorShake(false);
        setPin('');
      }, 450);
    }
  };

  const handleManualReset = () => {
    onUpdateSecurity({ pin: '0000' });
    setAttemptsLeft(3);
    setPin('');
    setErrorMessage(null);
    setResetNotice('Passcode has been reset to default: 0000.');
    setShowForgotModal(false);
    sound.playSuccessChime();
    triggerHaptic('success');
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-screen bg-surface text-on-surface select-none relative overflow-hidden justify-between p-5">
      {/* Ambient background glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & App Identity */}
      <div className="pt-6 text-center space-y-2 z-10">
        <div className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-surface-container-high border border-outline-variant/30 text-primary shadow-xs">
          {unlockSuccess ? (
            <ShieldCheck className="w-8 h-8 text-emerald-500 animate-bounce" />
          ) : (
            <Lock className="w-8 h-8 text-primary stroke-[2.2]" />
          )}
        </div>

        <div>
          <h1 className="text-xl font-black text-on-surface tracking-tight">
            {unlockSuccess
              ? 'Unlocked!'
              : profile.name
              ? `Welcome back, ${profile.name}`
              : 'OrbitGoals Secured'}
          </h1>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            {unlockSuccess ? 'Access granted' : 'Enter 4-digit Passcode to Unlock'}
          </p>
        </div>
      </div>

      {/* Middle Section: Passcode Dots & Feedback */}
      <div className="my-auto py-3 flex flex-col items-center justify-center space-y-4 z-10">
        {/* Reset Notification Banner if 3 tries failed */}
        {resetNotice && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2 max-w-xs text-left animate-in fade-in shadow-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="leading-snug">{resetNotice}</span>
          </div>
        )}

        {/* 4-Digit Passcode Dots */}
        <div className="flex flex-col items-center space-y-3 pt-1">
          <div
            className={`flex items-center gap-4 transition-transform ${
              errorShake ? 'animate-shake' : ''
            }`}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 border ${
                    unlockSuccess
                      ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : errorShake
                      ? 'bg-red-500 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                      : isFilled
                      ? 'bg-primary border-primary scale-115 shadow-[0_0_10px_rgba(103,80,164,0.4)]'
                      : 'border-outline-variant/60 bg-surface-container'
                  }`}
                />
              );
            })}
          </div>

          {/* Dynamic Attempts & Error Messaging */}
          {errorMessage ? (
            <p className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant/80">
              <span>Attempts remaining:</span>
              <span
                className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                  attemptsLeft === 1
                    ? 'bg-red-500/15 dark:bg-red-500/25 text-red-700 dark:text-red-300'
                    : attemptsLeft === 2
                    ? 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {attemptsLeft}/3
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Numeric Keypad (1-9, Clear, 0, Backspace) */}
      <div className="w-full max-w-[280px] mx-auto pb-4 z-10">
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigitTap(num)}
              disabled={unlockSuccess}
              className="h-13 rounded-2xl bg-surface-container hover:bg-surface-container-high active:bg-primary active:text-on-primary border border-outline-variant/30 text-on-surface font-black text-xl transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-92"
            >
              {num}
            </button>
          ))}

          {/* Bottom row: Clear / 0 / Backspace */}
          <button
            onClick={handleClear}
            disabled={unlockSuccess || pin.length === 0}
            className="h-13 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high active:scale-92 transition-all flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border border-outline-variant/20 font-bold text-xs"
            title="Clear entered digits"
          >
            Clear
          </button>

          <button
            onClick={() => handleDigitTap('0')}
            disabled={unlockSuccess}
            className="h-13 rounded-2xl bg-surface-container hover:bg-surface-container-high active:bg-primary active:text-on-primary border border-outline-variant/30 text-on-surface font-black text-xl transition-all flex items-center justify-center cursor-pointer shadow-xs active:scale-92"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            disabled={unlockSuccess || pin.length === 0}
            className="h-13 rounded-2xl bg-surface-container/60 hover:bg-surface-container-high active:scale-92 transition-all flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border border-outline-variant/20"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Forgot Passcode & Guest Mode Helpers */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            onClick={() => setShowForgotModal(true)}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer opacity-80 hover:opacity-100"
          >
            Forgot Passcode?
          </button>
          <span className="text-on-surface-variant/40 text-xs">·</span>
          <button
            onClick={() => {
              onUpdateSecurity({ enabled: false });
              sound.playUnlock();
              triggerHaptic('success');
              onUnlock();
            }}
            className="text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>
      </div>

      {/* Forgot Passcode Dialog Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/30 rounded-3xl p-5 max-w-xs w-full space-y-4 shadow-xl">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-on-surface">Forgot your passcode?</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                OrbitGoals gives you <strong>3 attempts</strong>. If entered incorrectly 3 times, your passcode automatically resets to the default code of <strong className="text-primary font-mono font-bold">0000</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleManualReset}
                className="w-full py-2.5 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs cursor-pointer hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default (0000)</span>
              </button>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 px-3 rounded-xl bg-surface-container text-on-surface font-semibold text-xs cursor-pointer hover:bg-surface-container-high transition-all text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
