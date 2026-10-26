import React, { useState } from 'react';
import { UserProfile, SecurityConfig } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import { fireConfetti } from '../utils/confetti';
import { AVATAR_PRESETS } from '../utils/avatars';
import {
  Sparkles,
  Target,
  Calendar,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  Youtube,
  Instagram,
  DollarSign,
  Dumbbell,
  ShieldCheck,
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
  // Step 0: Welcome, Step 1: Features Tour, Step 2: Name, Age & Security Setup
  const [step, setStep] = useState<number>(0);

  // Profile Form State
  const [name, setName] = useState<string>(initialProfile?.name || '');
  const [age, setAge] = useState<string>(initialProfile?.age ? String(initialProfile.age) : '');
  const [avatarId, setAvatarId] = useState<string>(initialProfile?.avatarId || 'cosmic-astronaut');
  const [pin, setPin] = useState<string>(initialSecurity?.pin || '0000');
  const [appLockEnabled, setAppLockEnabled] = useState<boolean>(
    initialSecurity ? initialSecurity.enabled : true
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNextStep = () => {
    sound.playPop();
    triggerHaptic('light');
    setStep((prev) => Math.min(prev + 1, 2));
  };

  const handlePrevStep = () => {
    sound.playPop();
    triggerHaptic('light');
    setStep((prev) => Math.max(prev - 1, 0));
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
      avatarId,
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
    fireConfetti(2800);

    onComplete(updatedProfile, updatedSecurity);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface text-on-surface relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Step Progress Bar */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md px-5 pt-8 pb-3 border-b border-outline-variant/20 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {isReplay && onCancelReplay && (
            <button
              onClick={onCancelReplay}
              className="p-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-primary block leading-none">
              Welcome to OrbitGoals
            </span>
            <span className="text-[16px] font-bold text-on-surface">
              Step {step + 1} of 3
            </span>
          </div>
        </div>

        {/* 3 Step Pill Indicators */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? 'w-6 bg-primary'
                  : step > s
                  ? 'w-2 bg-primary/60'
                  : 'w-2 bg-outline-variant/40'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-between">
        {/* STEP 0: WELCOME & INTRODUCTION */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 my-auto">
            {/* Visual Hero Badge */}
            <div className="text-center space-y-3">
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-primary-container text-on-primary shadow-lg mx-auto">
                <span className="text-3xl font-black tracking-tight font-sans">OG</span>
                <div className="absolute -inset-1.5 rounded-3xl border-2 border-primary/30 animate-pulse pointer-events-none" />
              </div>

              <div className="space-y-1">
                <h1 className="text-[28px] font-black text-on-surface tracking-tight">
                  Meet OrbitGoals
                </h1>
                <p className="text-xs text-on-surface-variant font-medium max-w-xs mx-auto leading-relaxed">
                  Your smart, distraction-free daily goal & milestone progress studio.
                </p>
              </div>
            </div>

            {/* Introduction Pillars */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Target className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-on-surface">Target-First Mindset</h3>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-normal">
                    No artificial streak stress or penalty resets. Focus purely on hitting what matters to you.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-on-surface">Lightning Speed</h3>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-normal">
                    Compact single-line cards that never stack. Increment with <span className="font-bold text-primary">+1</span> or undo mistakes instantly with <span className="font-bold text-red-500">-1</span>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-on-surface">Privacy & Security</h3>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-normal">
                    Lock with 4-digit Passcode on every app launch (3 tries max, then auto-reset to 0000). 100% offline data storage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: ALL FEATURES PERFECTLY EXPLAINED BRIEFLY */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                Full Tour
              </span>
              <h2 className="text-[23px] font-black text-on-surface tracking-tight">
                All App Features Explained
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Everything you need to master your daily targets in seconds:
              </p>
            </div>

            {/* Feature 1: Gamified Habits & Goals */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                <Sparkles className="w-4 h-4" />
                <span className="text-[14px]">Gamified Habits & XP (+10 / +50 XP)</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Earn <strong>+10 XP</strong> for every habit completed today, and <strong>+50 XP</strong> for every step towards finishing a goal! Level up your rank from Novice to Grandmaster.
              </p>
            </div>

            {/* Feature 2: Frequency & Custom Cadence */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Calendar className="w-4 h-4" />
                <span className="text-[14px]">Flexible Frequency</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Choose <strong>Daily</strong>, <strong>Long Term</strong> (appears everyday), <strong>Weekly</strong> (with optional specific days), or <strong>Monthly</strong> frequency with live percentage progress rings.
              </p>
            </div>

            {/* Feature 2: Content Creator & Goal Presets */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="text-[14px]">Instant Category & Icon Chips</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Scrollable presets right inside your typing bar — YouTube videos, Instagram reels, Facebook posts, savings, gym reps, or custom categories.
              </p>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                <span className="px-2 py-0.5 rounded-lg bg-surface text-red-500 font-bold text-[10px] flex items-center gap-1 border border-outline-variant/20">
                  <Youtube className="w-3 h-3" /> YouTube
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-surface text-pink-500 font-bold text-[10px] flex items-center gap-1 border border-outline-variant/20">
                  <Instagram className="w-3 h-3" /> Reels
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-surface text-emerald-500 font-bold text-[10px] flex items-center gap-1 border border-outline-variant/20">
                  <DollarSign className="w-3 h-3" /> Money
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-surface text-amber-500 font-bold text-[10px] flex items-center gap-1 border border-outline-variant/20">
                  <Dumbbell className="w-3 h-3" /> Fitness
                </span>
              </div>
            </div>

            {/* Feature 3: Goals Heat Zone Calendar */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Calendar className="w-4 h-4" />
                <span className="text-[14px]">Goals Heat Zone Calendar</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Tap the calendar icon on any goal to view its monthly activity heat zone, observe consistent volume, and inspect day-by-day accomplishments.
              </p>
            </div>

            {/* Feature 4: Mistake Undo & Batch Logging */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Zap className="w-4 h-4" />
                <span className="text-[14px]">Undo Minus (-1) & Plus (+1)</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Mistakenly logged an extra unit? Simply tap <strong>-1</strong> to safely decrement without ruining your data.
              </p>
            </div>

            {/* Feature 5: Passcode Lock */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Lock className="w-4 h-4" />
                <span className="text-[14px]">App Passcode Lock</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Keeps your personal targets confidential. Unlock every time using your 4-digit passcode, with safety reset to 0000 after 3 tries.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: USER PROFILE ENTRY (NAME & AGE) + PASSCODE SETUP */}
        {step === 2 && (
          <form onSubmit={handleFinish} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                Personalization
              </span>
              <h2 className="text-xl font-black text-on-surface tracking-tight">
                Profile & Security Setup
              </h2>
              <p className="text-xs text-on-surface-variant">
                Enter your details to initialize your personalized goal studio:
              </p>
            </div>

            {validationError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-shake">
                <span>⚠️ {validationError}</span>
              </div>
            )}

            {/* Avatar Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Choose Profile Picture</span>
                </span>
                <span className="text-[10px] text-primary font-bold">Pick an avatar</span>
              </label>
              <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = preset.id === avatarId;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAvatarId(preset.id);
                        sound.playPop();
                        triggerHaptic('light');
                      }}
                      className={`relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-sm'
                          : 'border-outline-variant/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. Name Entry */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Your Name</span>
                <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationError(null);
                }}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary text-sm font-semibold"
              />
            </div>

            {/* 2. Age Entry */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Your Age</span>
                <span className="text-primary">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  setValidationError(null);
                }}
                placeholder="e.g. 24"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary text-sm font-semibold"
              />
            </div>

            {/* 3. Passcode Setup */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-on-surface">Lock App on Opening</span>
                </div>
                <input
                  type="checkbox"
                  checked={appLockEnabled}
                  onChange={(e) => setAppLockEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {appLockEnabled && (
                <div className="space-y-2.5 pt-1 border-t border-outline-variant/20">
                  <div>
                    <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                      Set 4-Digit Passcode (Default: 0000)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      value={pin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPin(val);
                        setValidationError(null);
                      }}
                      placeholder="0000"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/40 text-center font-mono font-bold tracking-widest text-base focus:outline-none focus:border-primary"
                    />
                    <p className="text-[10px] text-on-surface-variant mt-1.5 leading-normal">
                      Security protection: 3 incorrect attempts will automatically reset your code to <span className="text-primary font-bold">0000</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="pt-6 mt-auto">
          {step < 2 ? (
            <div className="flex items-center gap-2.5">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="h-12 px-4 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-[14px]">Back</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 h-12 rounded-2xl bg-primary text-on-primary font-bold text-sm hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span className="text-[16px]">{step === 0 ? 'Explore All Features' : 'Set Up Profile & Lock'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrevStep}
                className="h-12 px-4 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 h-12 rounded-2xl bg-primary text-on-primary font-black text-sm hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Get Started in OrbitGoals</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
