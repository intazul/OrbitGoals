import React, { useState } from 'react';
import { UserProfile, SecurityConfig } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { fireConfetti } from '../utils/confetti';
import {
  Target,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: (profile: UserProfile, security: SecurityConfig) => void;
  initialProfile?: UserProfile;
  initialSecurity?: SecurityConfig;
  isReplay?: boolean;
  onCancelReplay?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  initialProfile,
  initialSecurity,
  isReplay = false,
  onCancelReplay,
}) => {
  // Step 0: Brief Introduction & Instant Guest Access
  // Step 1: Quick Optional Profile & Passcode Setup (non-scrollable)
  const [step, setStep] = useState<number>(0);

  // Profile Form State
  const [name, setName] = useState<string>(initialProfile?.name || '');
  const [age, setAge] = useState<string>(initialProfile?.age ? String(initialProfile.age) : '24');
  const [pin, setPin] = useState<string>(initialSecurity?.pin || '0000');
  const [appLockEnabled, setAppLockEnabled] = useState<boolean>(
    initialSecurity ? initialSecurity.enabled : false
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleContinueAsGuest = () => {
    sound.playSuccessChime();
    triggerHaptic('success');
    fireConfetti(2000);
    onComplete(
      {
        ...(initialProfile || {}),
        name: 'Guest User',
        age: 24,
        onboarded: true,
        title: 'Goal Pioneer',
      },
      {
        enabled: false,
        pin: '0000',
        biometricEnabled: false,
      }
    );
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Please enter your name.');
      sound.playErrorTone();
      triggerHaptic('medium');
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      setValidationError('Please enter a valid age (1 - 120).');
      sound.playErrorTone();
      triggerHaptic('medium');
      return;
    }

    const cleanPin = pin.trim();
    if (appLockEnabled && (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin))) {
      setValidationError('Please set a 4-digit numeric passcode (e.g. 0000).');
      sound.playErrorTone();
      triggerHaptic('medium');
      return;
    }

    const updatedProfile: UserProfile = {
      ...(initialProfile || {}),
      name: trimmedName,
      age: parsedAge,
      onboarded: true,
      title: 'Goal Achiever',
    };

    const updatedSecurity: SecurityConfig = {
      enabled: appLockEnabled,
      pin: cleanPin || '0000',
      biometricEnabled: false,
    };

    sound.playSuccessChime();
    triggerHaptic('success');
    fireConfetti(2500);
    onComplete(updatedProfile, updatedSecurity);
  };

  return (
    <div className="flex-1 flex flex-col h-full max-h-screen bg-surface text-on-surface relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header
        style={{ marginTop: '32px', paddingLeft: '17px' }}
        className="pl-[17px] pr-4 pt-6 pb-2 mt-[32px] border-b border-outline-variant/20 flex items-center justify-between gap-3 shrink-0 bg-surface/90 backdrop-blur-md z-10"
      >
        <div className="flex items-center gap-2">
          {isReplay && onCancelReplay && (
            <button
              onClick={onCancelReplay}
              className="p-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          {step === 1 && (
            <button
              onClick={() => {
                setStep(0);
                sound.playPop();
              }}
              className="p-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <span
              style={{ fontSize: '17px', fontFamily: 'Georgia', fontWeight: 'normal' }}
              className="text-[17px] font-normal uppercase tracking-wider text-primary block leading-none font-serif"
            >
              OrbitGoals
            </span>
            <span
              style={{ fontSize: '27px' }}
              className="text-[27px] font-bold text-on-surface leading-tight"
            >
              {step === 0 ? 'Welcome' : 'Quick Profile'}
            </span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 0 ? 'w-5 bg-primary' : 'w-2 bg-primary/40'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-5 bg-primary' : 'w-2 bg-outline-variant/40'}`} />
        </div>
      </header>

      {/* Main Container - Non-scrollable compact layout */}
      <div className="flex-1 px-4 py-3 flex flex-col justify-between overflow-hidden">
        {/* STEP 0: BRIEF COMPACT INTRODUCTION */}
        {step === 0 ? (
          <div className="flex-1 flex flex-col justify-between py-1 animate-in fade-in duration-200">
            {/* Hero Banner */}
            <div className="text-center pt-2">
              <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary-container text-on-primary shadow-md mb-2">
                <span className="text-2xl font-black tracking-tight font-sans">OG</span>
                <div className="absolute -inset-1 rounded-2xl border border-primary/40 animate-pulse pointer-events-none" />
              </div>
              <h1
                style={{ fontSize: '23px' }}
                className="text-[23px] font-black text-on-surface tracking-tight leading-tight"
              >
                OrbitGoals
              </h1>
              <p
                style={{ fontSize: '9px' }}
                className="text-[9px] text-on-surface-variant font-medium max-w-xs mx-auto mt-0.5 leading-snug"
              >
                Master daily habits, track reps & sets, and power your goals with gamified XP.
              </p>
            </div>

            {/* 3 Ultra-Brief Feature Cards (Compact 1-liners) */}
            <div className="space-y-2 my-auto py-2">
              <div className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3
                    style={{ fontSize: '15px' }}
                    className="text-[15px] font-bold text-on-surface leading-none"
                  >
                    Habit Sets & Goals
                  </h3>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
                    Log workout sets & video uploads connected directly to your goals.
                  </p>
                </div>
              </div>

              <div className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3
                    style={{ fontSize: '15px' }}
                    className="text-[15px] font-bold text-on-surface leading-none"
                  >
                    Earn XP on Every Step
                  </h3>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
                    Custom XP per set (+10 XP) and goal steps (+50 XP). Level up as you progress!
                  </p>
                </div>
              </div>

              <div className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <h3
                    style={{ fontSize: '15px' }}
                    className="text-[15px] font-bold text-on-surface leading-none"
                  >
                    100% Private & Offline
                  </h3>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
                    Zero signup or login required. Your data never leaves your device.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions (Guest Login + Custom Profile) */}
            <div className="space-y-2 pt-1 pb-1">
              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-black text-[13px] flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span
                  style={{ fontSize: '16px' }}
                  className="text-[16px]"
                >
                  Instant Guest Access (No Signup)
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5] ml-auto" />
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  triggerHaptic('light');
                  setStep(1);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-bold text-[12px] flex items-center justify-center gap-2 hover:bg-surface-container-high active:scale-98 transition-all cursor-pointer"
              >
                <span>Set Name & Passcode Lock</span>
              </button>
            </div>
          </div>
        ) : (
          /* STEP 1: COMPACT PROFILE & PIN SETUP */
          <form onSubmit={handleFinish} className="flex-1 flex flex-col justify-between py-1 animate-in fade-in duration-200">
            <div className="space-y-3 pt-1">
              <div>
                <h2 className="text-[16px] font-black text-on-surface">Your Profile</h2>
                <p className="text-[11px] text-on-surface-variant">Customize your name and optional app lock.</p>
              </div>

              {validationError && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-bold">
                  {validationError}
                </div>
              )}

              {/* Name & Age Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant block">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    maxLength={30}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-sm font-semibold text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-[11px] font-bold text-on-surface-variant block">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="24"
                    min={1}
                    max={120}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-sm font-semibold text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Security PIN Lock Card */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[12px] font-bold text-on-surface block leading-tight">4-Digit Passcode</span>
                      <span className="text-[10px] text-on-surface-variant">Require PIN on launch</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={appLockEnabled}
                    onChange={(e) => {
                      setAppLockEnabled(e.target.checked);
                      sound.playPop();
                    }}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {appLockEnabled && (
                  <div className="pt-1">
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Enter 4 digits"
                      className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono rounded-xl bg-surface border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Launch Button */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-black text-[13px] flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch OrbitGoals</span>
              </button>

              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="w-full py-1 text-[11px] font-semibold text-on-surface-variant hover:text-primary transition-colors text-center cursor-pointer"
              >
                Skip and continue as Guest
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
