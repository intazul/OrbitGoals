import React, { useRef, useState, useEffect } from 'react';
import { AppSettings, UserProfile, SecurityConfig, Goal, Habit } from '../types';
import { storage } from '../utils/storage';
import { sound, triggerHaptic } from '../utils/sound';
import {
  ArrowLeft,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Download,
  Upload,
  RotateCcw,
  Check,
  Palette,
  Sliders,
  Database,
  Info,
  Lock,
  KeyRound,
  User,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Zap,
  Sparkles,
  Fingerprint,
  Copy,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import {
  checkBiometricAvailability,
  enrollFingerprint,
  verifyFingerprint,
  removeBiometricCredential,
  hasEnrolledBiometric,
  BiometricCheckResult,
} from '../utils/biometrics';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onBack: () => void;
  onResetAllData: () => void;
  totalGoalsCount: number;
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  security: SecurityConfig;
  onUpdateSecurity: (updates: Partial<SecurityConfig>) => void;
  onReplayTour: () => void;
  onLockNow: () => void;
  onRestoreBackup?: (backupData: {
    goals: Goal[];
    habits: Habit[];
    profile: UserProfile;
    settings: AppSettings;
    security: SecurityConfig;
  }) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  onResetAllData,
  totalGoalsCount,
  profile,
  onUpdateProfile,
  security,
  onUpdateSecurity,
  onReplayTour,
  onLockNow,
  onRestoreBackup,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);
  const [backupErrorMsg, setBackupErrorMsg] = useState<string | null>(null);

  // Real Hardware Fingerprint Scanner State
  const [biometricInfo, setBiometricInfo] = useState<BiometricCheckResult | null>(null);
  const [isEnrollingBiometric, setIsEnrollingBiometric] = useState<boolean>(false);
  const [isTestingBiometric, setIsTestingBiometric] = useState<boolean>(false);
  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricAvailability().then((res) => {
      setBiometricInfo(res);
    });
  }, []);

  // Profile Edit Modal State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(profile.name);
  const [editAge, setEditAge] = useState<string>(profile.age ? String(profile.age) : '');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);

  // Change PIN Modal State
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);
  const [pinChangeSuccess, setPinChangeSuccess] = useState<boolean>(false);

  // Toggle Fingerprint Biometrics with Real Hardware Scanner Scan
  const handleToggleBiometric = async (enable: boolean) => {
    if (!enable) {
      removeBiometricCredential();
      onUpdateSecurity({ biometricEnabled: false });
      sound.playPop();
      triggerHaptic('light');
      setBiometricFeedback('Fingerprint authentication disabled.');
      setTimeout(() => setBiometricFeedback(null), 3000);
      return;
    }

    if (!biometricInfo?.hasPlatformScanner) {
      sound.playErrorTone();
      triggerHaptic('medium');
      setBiometricFeedback(
        biometricInfo?.reason ||
          'No real hardware fingerprint scanner detected on this device. Fingerprint requires a physical biometric sensor.'
      );
      setTimeout(() => setBiometricFeedback(null), 4500);
      return;
    }

    setIsEnrollingBiometric(true);
    setBiometricFeedback('Touch your device fingerprint sensor now...');
    sound.playPop();

    try {
      const enrollResult = await enrollFingerprint('orbitgoals-user', profile.name || 'User');
      if (enrollResult.success) {
        onUpdateSecurity({ biometricEnabled: true });
        sound.playSuccessChime();
        triggerHaptic('success');
        setBiometricFeedback('Fingerprint successfully registered and active!');
        setTimeout(() => setBiometricFeedback(null), 4000);
      } else if (enrollResult.cancelled) {
        setBiometricFeedback('Fingerprint scan cancelled.');
        setTimeout(() => setBiometricFeedback(null), 3000);
      } else {
        sound.playErrorTone();
        triggerHaptic('medium');
        setBiometricFeedback(enrollResult.error || 'Failed to register fingerprint.');
        setTimeout(() => setBiometricFeedback(null), 4000);
      }
    } catch {
      setBiometricFeedback('An unexpected error occurred during fingerprint enrollment.');
      setTimeout(() => setBiometricFeedback(null), 3000);
    } finally {
      setIsEnrollingBiometric(false);
    }
  };

  // Test Real Fingerprint Scanner
  const handleTestBiometric = async () => {
    if (isTestingBiometric) return;
    setIsTestingBiometric(true);
    setBiometricFeedback('Place finger on device scanner to test...');
    sound.playPop();
    triggerHaptic('light');

    try {
      const testResult = await verifyFingerprint();
      if (testResult.success) {
        sound.playSuccessChime();
        triggerHaptic('success');
        setBiometricFeedback('Real fingerprint verified successfully! Sensor is working.');
        setTimeout(() => setBiometricFeedback(null), 4000);
      } else if (testResult.cancelled) {
        setBiometricFeedback('Test cancelled.');
        setTimeout(() => setBiometricFeedback(null), 3000);
      } else {
        sound.playErrorTone();
        triggerHaptic('medium');
        setBiometricFeedback(testResult.error || 'Fingerprint verification failed.');
        setTimeout(() => setBiometricFeedback(null), 4000);
      }
    } catch {
      setBiometricFeedback('Biometric sensor test failed.');
      setTimeout(() => setBiometricFeedback(null), 3000);
    } finally {
      setIsTestingBiometric(false);
    }
  };

  // Smooth JSON Backup Export
  const handleExport = () => {
    try {
      const dataStr = storage.exportFullBackup();
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbitgoals_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sound.playSuccessChime();
      triggerHaptic('success');
      setBackupSuccessMsg('Backup JSON exported and downloaded successfully!');
      setBackupErrorMsg(null);
      setTimeout(() => setBackupSuccessMsg(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBackupErrorMsg(`Export error: ${msg}`);
      setTimeout(() => setBackupErrorMsg(null), 4000);
    }
  };

  // Copy JSON Backup to Clipboard
  const handleCopyBackup = () => {
    try {
      const dataStr = storage.exportFullBackup();
      navigator.clipboard?.writeText(dataStr);
      sound.playSuccessChime();
      triggerHaptic('success');
      setBackupSuccessMsg('Backup JSON copied to clipboard!');
      setBackupErrorMsg(null);
      setTimeout(() => setBackupSuccessMsg(null), 3000);
    } catch {
      setBackupErrorMsg('Could not copy to clipboard.');
      setTimeout(() => setBackupErrorMsg(null), 3000);
    }
  };

  // Smooth JSON Backup Import (Deep validation, zero reload freeze)
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be selected again if needed
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = storage.importFullBackup(content);

      if (result.success && result.data) {
        sound.playSuccessChime();
        triggerHaptic('success');

        // Immediately update React state smoothly without requiring hard reload
        if (onRestoreBackup) {
          onRestoreBackup(result.data);
        }

        setBackupSuccessMsg(
          `Backup restored smoothly! Restored ${result.counts?.goals || 0} Goals & ${
            result.counts?.habits || 0
          } Habits.`
        );
        setBackupErrorMsg(null);
        setTimeout(() => setBackupSuccessMsg(null), 5000);
      } else {
        sound.playErrorTone();
        triggerHaptic('medium');
        setBackupErrorMsg(result.error || 'Invalid backup file format. Please use a valid OrbitGoals JSON.');
        setTimeout(() => setBackupErrorMsg(null), 5000);
      }
    };

    reader.onerror = () => {
      setBackupErrorMsg('Failed to read the selected file.');
      setTimeout(() => setBackupErrorMsg(null), 4000);
    };

    reader.readAsText(file);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    onUpdateSettings({ theme: newTheme });
    sound.playPop();
    triggerHaptic('light');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editName.trim();
    const cleanAge = parseInt(editAge, 10);

    if (!cleanName) {
      sound.playErrorTone();
      return;
    }

    onUpdateProfile({
      name: cleanName,
      age: isNaN(cleanAge) ? null : cleanAge,
    });

    sound.playSuccessChime();
    triggerHaptic('success');
    setProfileSaveSuccess(true);
    setTimeout(() => {
      setProfileSaveSuccess(false);
      setIsEditingProfile(false);
    }, 800);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinChangeError('PIN must be exactly 4 numeric digits.');
      sound.playErrorTone();
      triggerHaptic('medium');
      return;
    }

    if (newPin !== confirmPin) {
      setPinChangeError('Passcodes do not match.');
      sound.playErrorTone();
      triggerHaptic('medium');
      return;
    }

    onUpdateSecurity({ pin: newPin });
    sound.playSuccessChime();
    triggerHaptic('success');
    setPinChangeSuccess(true);
    setTimeout(() => {
      setPinChangeSuccess(false);
      setIsChangingPin(false);
      setNewPin('');
      setConfirmPin('');
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface text-on-surface">
      {/* Settings Top Header with Back Button - Space Upwards */}
      <header
        style={{ marginTop: '32px', marginLeft: '0px' }}
        className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 px-4 mt-8 pt-6 pb-3 shrink-0 flex items-center justify-between gap-3"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 py-2 px-3 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer font-bold text-sm min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5 text-primary stroke-[2.5]" />
          <span>Back</span>
        </button>

        <h1 className="text-lg font-black text-on-surface tracking-tight">
          Settings
        </h1>

        <div className="w-16" /> {/* Spacer for symmetry */}
      </header>

      {/* Main Settings Scrollable Body */}
      <div className="flex-1 px-4 pt-3 pb-10 space-y-4 overflow-y-auto">
        {backupSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 stroke-[3]" />
            <span>{backupSuccessMsg}</span>
          </div>
        )}

        {backupErrorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>{backupErrorMsg}</span>
          </div>
        )}

        {/* 1. Profile Details Card (Name and Age) - No Avatar */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
              <User className="w-4 h-4" />
              <span>User Profile</span>
            </div>
            <button
              onClick={() => {
                setEditName(profile.name);
                setEditAge(profile.age ? String(profile.age) : '');
                setIsEditingProfile(true);
              }}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Edit Details
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-outline-variant/20">
            <div className="w-11 h-11 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-black text-lg shrink-0">
              {profile.name ? profile.name.trim().charAt(0).toUpperCase() : 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-on-surface truncate">
                  {profile.name || 'Guest User'}
                </h3>
                {(!profile.name || profile.name.toLowerCase().includes('guest')) && (
                  <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                    Guest Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant font-medium">
                {profile.age ? `Age: ${profile.age} years old` : 'Age not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* 1b. Instant Guest Access Card (No Signup/Login Required) */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Instant Guest Access</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            No login, signup, or email is ever required. OrbitGoals runs 100% locally and privately on your device.
          </p>

          <button
            onClick={() => {
              onUpdateProfile({ name: 'Guest User', age: 24, title: 'Goal Pioneer' });
              onUpdateSecurity({ enabled: false });
              sound.playSuccessChime();
              triggerHaptic('success');
              setBackupSuccessMsg('Switched to Guest Login mode (no signup/login required)!');
              setTimeout(() => setBackupSuccessMsg(null), 3000);
            }}
            className="w-full py-2.5 px-3 rounded-2xl bg-surface border border-outline-variant/30 hover:bg-surface-container text-primary font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Switch to Guest Profile (No Login / Sign-up)</span>
          </button>
        </div>

        {/* 2. Security & App Lock (Passcode & Auto-Lock Timer) */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4.5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>Security & App Lock</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              security.enabled
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-surface-container text-on-surface-variant'
            }`}>
              {security.enabled ? 'Protected' : 'Disabled'}
            </span>
          </div>

          <div className="space-y-3">
            {/* Lock on opening app toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-on-surface block leading-tight">
                    Require App Passcode
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    Require 4-digit passcode to protect habits & goals
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={security.enabled}
                onChange={(e) => {
                  onUpdateSecurity({ enabled: e.target.checked });
                  sound.playPop();
                  triggerHaptic('light');
                }}
                className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {/* Auto-Lock Duration Selection: Immediately or within minutes */}
            {security.enabled && (
              <div className="p-3 rounded-2xl bg-surface border border-outline-variant/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>Auto-Lock Timeout</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {security.autoLockMinutes === 0
                      ? '⚡ Immediately'
                      : security.autoLockMinutes === -1
                      ? 'Manual Only'
                      : `⏱️ Within ${security.autoLockMinutes} min`}
                  </span>
                </div>

                <p className="text-[11px] text-on-surface-variant leading-tight">
                  Choose when to automatically lock the app after switching or leaving:
                </p>

                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[
                    { minutes: 0, label: 'Immediate' },
                    { minutes: 1, label: '1 min' },
                    { minutes: 5, label: '5 min' },
                    { minutes: 15, label: '15 min' },
                  ].map((opt) => {
                    const isSelected = security.autoLockMinutes === opt.minutes;
                    return (
                      <button
                        key={opt.minutes}
                        type="button"
                        onClick={() => {
                          onUpdateSecurity({ autoLockMinutes: opt.minutes });
                          sound.playPop();
                          triggerHaptic('light');
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-on-primary border-primary shadow-xs scale-102'
                            : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real Hardware Fingerprint Scanner Toggle & Testing */}
            <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-container text-primary flex items-center justify-center shrink-0">
                    <Fingerprint className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-on-surface block leading-tight">
                      Fingerprint Authentication
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Unlock with device's real hardware biometric scanner
                    </span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={security.biometricEnabled}
                  onChange={(e) => handleToggleBiometric(e.target.checked)}
                  disabled={isEnrollingBiometric}
                  className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                />
              </div>

              {/* Hardware Status Banner */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-outline-variant/20">
                <span className="text-on-surface-variant font-medium">Scanner Hardware:</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    biometricInfo?.hasPlatformScanner
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {biometricInfo?.hasPlatformScanner ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Real Biometric Sensor Detected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Hardware Scanner Not Detected</span>
                    </>
                  )}
                </span>
              </div>

              {/* Test Scanner Button */}
              {security.biometricEnabled && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleTestBiometric}
                    disabled={isTestingBiometric}
                    className="w-full py-2 px-3 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs font-bold hover:bg-primary/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingBiometric ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Fingerprint className="w-3.5 h-3.5" />
                    )}
                    <span>{isTestingBiometric ? 'Testing Scanner...' : 'Test Fingerprint Sensor'}</span>
                  </button>
                </div>
              )}

              {biometricFeedback && (
                <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/25 text-primary font-bold text-[11px] text-center animate-in fade-in leading-snug">
                  {biometricFeedback}
                </div>
              )}
            </div>

            {/* Change Passcode & Lock Now Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setNewPin('');
                  setConfirmPin('');
                  setPinChangeError(null);
                  setIsChangingPin(true);
                }}
                className="py-2.5 px-3 rounded-2xl bg-surface border border-outline-variant/30 hover:bg-surface-container text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                <span>Change Passcode</span>
              </button>

              <button
                onClick={onLockNow}
                className="py-2.5 px-3 rounded-2xl bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock App Now</span>
              </button>
            </div>
          </div>
        </div>


        {/* 4. Appearance & Theme */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4.5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Palette className="w-4 h-4" />
            <span>Appearance & Theme</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { id: 'dark' as const, label: 'Dark Mode', icon: Moon },
              { id: 'light' as const, label: 'Light Mode', icon: Sun },
              { id: 'system' as const, label: 'System', icon: Sliders },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[58px] ${
                    isSelected
                      ? 'border-primary bg-primary text-on-primary font-bold shadow-xs scale-102'
                      : 'border-outline-variant/30 bg-surface text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Audio & Haptics Feedback */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4.5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Volume2 className="w-4 h-4" />
            <span>Sound & Feedback</span>
          </div>

          <div className="space-y-2.5">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface flex items-center justify-center">
                  {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-on-surface-variant" />}
                </div>
                <div>
                  <span className="text-sm font-bold text-on-surface block leading-tight">Sound Effects</span>
                  <span className="text-xs text-on-surface-variant">Play audio chimes on completion</span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => {
                  onUpdateSettings({ soundEnabled: e.target.checked });
                  sound.playPop();
                }}
                className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {/* Haptic Vibration Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-bold text-on-surface block leading-tight">Haptic Vibration</span>
                  <span className="text-xs text-on-surface-variant">Tactile click when tapping goals</span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.hapticsEnabled}
                onChange={(e) => {
                  onUpdateSettings({ hapticsEnabled: e.target.checked });
                  triggerHaptic('light');
                }}
                className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 6b. XP Step Rates & Gamification Tuning */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4.5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <Zap className="w-4 h-4 fill-current" />
              <span>XP Step Rates & Gamification</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Level 1,000 Scaling
            </span>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            Customize the amount of XP earned per goal step and habit set. Tune progression speed to match your routine.
          </p>

          {/* Goal XP per Step Setting */}
          <div className="p-3 rounded-2xl bg-surface border border-outline-variant/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Goal Step XP Reward</span>
              </span>
              <span className="text-xs font-black font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                +{settings.goalXpPerStep ?? 50} XP / step
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {[25, 50, 100, 200].map((xpVal) => {
                const isSelected = (settings.goalXpPerStep ?? 50) === xpVal;
                return (
                  <button
                    key={xpVal}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ goalXpPerStep: xpVal });
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-xs scale-102'
                        : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    +{xpVal} XP
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-on-surface-variant font-medium shrink-0">Custom XP:</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={settings.goalXpPerStep ?? 50}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) {
                    onUpdateSettings({ goalXpPerStep: Math.min(1000, val) });
                  }
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono text-xs font-bold focus:outline-none focus:border-primary"
                placeholder="Enter custom XP (1-1000)"
              />
            </div>
          </div>

          {/* Habit XP per Set Setting */}
          <div className="p-3 rounded-2xl bg-surface border border-outline-variant/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>Habit Set XP Reward</span>
              </span>
              <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                +{settings.habitXpPerSet ?? 10} XP / set
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {[5, 10, 25, 50].map((xpVal) => {
                const isSelected = (settings.habitXpPerSet ?? 10) === xpVal;
                return (
                  <button
                    key={xpVal}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ habitXpPerSet: xpVal });
                      sound.playPop();
                      triggerHaptic('light');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-xs scale-102'
                        : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    +{xpVal} XP
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-on-surface-variant font-medium shrink-0">Custom XP:</span>
              <input
                type="number"
                min={1}
                max={500}
                value={settings.habitXpPerSet ?? 10}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) {
                    onUpdateSettings({ habitXpPerSet: Math.min(500, val) });
                  }
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface font-mono text-xs font-bold focus:outline-none focus:border-primary"
                placeholder="Enter custom XP (1-500)"
              />
            </div>
          </div>
        </div>

        {/* 7. Data Backup & Storage */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4.5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Data & Backup</span>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleExport}
              className="w-full p-3.5 rounded-2xl bg-surface border border-outline-variant/30 hover:bg-surface-container flex items-center justify-between active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <span className="text-sm font-bold text-on-surface block leading-tight">Export JSON Backup</span>
                  <span className="text-xs text-on-surface-variant">Download complete backup file (.json)</span>
                </div>
              </div>
              <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-xl bg-primary/10">Download</span>
            </button>

            <button
              onClick={handleCopyBackup}
              className="w-full p-3.5 rounded-2xl bg-surface border border-outline-variant/30 hover:bg-surface-container flex items-center justify-between active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Copy className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <span className="text-sm font-bold text-on-surface block leading-tight">Copy Backup JSON</span>
                  <span className="text-xs text-on-surface-variant">Copy full backup text to device clipboard</span>
                </div>
              </div>
              <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-xl bg-primary/10">Copy</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3.5 rounded-2xl bg-surface border border-outline-variant/30 hover:bg-surface-container flex items-center justify-between active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <span className="text-sm font-bold text-on-surface block leading-tight">Restore from Backup</span>
                  <span className="text-xs text-on-surface-variant">Import an existing OrbitGoals JSON file</span>
                </div>
              </div>
              <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-xl bg-primary/10">Import</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json,application/json"
              className="hidden"
            />

            {/* Clear All Goals Data */}
            <button
              onClick={onResetAllData}
              className="w-full p-3.5 rounded-2xl bg-surface border border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-between active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5" />
                <div className="text-left">
                  <span className="text-sm font-bold block leading-tight">Reset All Goals</span>
                  <span className="text-xs opacity-80">Clears current list ({totalGoalsCount} goals)</span>
                </div>
              </div>
              <span className="text-xs font-bold">Reset</span>
            </button>
          </div>
        </div>

        {/* 8. App Info */}
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-on-surface block">OrbitGoals Android Edition</span>
            <span className="text-[11px] text-on-surface-variant">100% Offline-Ready · All data stored locally on your device</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProfile}
            className="bg-surface border border-outline-variant/30 rounded-3xl p-5 max-w-xs w-full space-y-4 shadow-xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-on-surface">Edit Profile Details</h3>
              {profileSaveSuccess && (
                <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface text-sm font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">
                  Your Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface text-sm font-semibold focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs cursor-pointer hover:brightness-105 active:scale-98 transition-all"
              >
                Save Profile
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="py-2.5 px-3 rounded-xl bg-surface-container text-on-surface font-semibold text-xs cursor-pointer hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Passcode Modal */}
      {isChangingPin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePin}
            className="bg-surface border border-outline-variant/30 rounded-3xl p-5 max-w-xs w-full space-y-4 shadow-xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-on-surface">Change 4-Digit PIN</h3>
              {pinChangeSuccess && (
                <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Updated
                </span>
              )}
            </div>

            {pinChangeError && (
              <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{pinChangeError}</span>
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">
                  New 4-Digit Passcode
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  required
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setPinChangeError(null);
                  }}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-center font-mono font-bold tracking-widest text-base focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">
                  Confirm New Passcode
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  required
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setPinChangeError(null);
                  }}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-center font-mono font-bold tracking-widest text-base focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs cursor-pointer hover:brightness-105 active:scale-98 transition-all"
              >
                Update PIN
              </button>
              <button
                type="button"
                onClick={() => setIsChangingPin(false)}
                className="py-2.5 px-3 rounded-xl bg-surface-container text-on-surface font-semibold text-xs cursor-pointer hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
