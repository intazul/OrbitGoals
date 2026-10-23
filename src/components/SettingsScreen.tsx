import React, { useRef, useState } from 'react';
import { AppSettings } from '../types';
import { storage } from '../utils/storage';
import { sound, triggerHaptic } from '../utils/sound';
import {
  ArrowLeft,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  BatteryCharging,
  Download,
  Upload,
  RotateCcw,
  Check,
  DollarSign,
  Palette,
  Sliders,
  Database,
  Info,
} from 'lucide-react';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onBack: () => void;
  onResetAllData: () => void;
  totalGoalsCount: number;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  onResetAllData,
  totalGoalsCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);

  const handleExport = () => {
    const dataStr = storage.exportFullBackup();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbitgoals_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    sound.playSuccessChime();
    triggerHaptic('success');
    setBackupSuccessMsg('Backup downloaded successfully!');
    setTimeout(() => setBackupSuccessMsg(null), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importFullBackup(content);
      if (success) {
        sound.playSuccessChime();
        triggerHaptic('success');
        setBackupSuccessMsg('Data restored successfully! Refreshing...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        alert('Invalid backup file. Please provide a valid OrbitGoals JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    onUpdateSettings({ theme: newTheme });
    sound.playPop();
    triggerHaptic('light');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface text-on-surface">
      {/* Settings Top Header with Back Button */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 px-4 py-3 shrink-0 flex items-center justify-between gap-3">
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
      <div className="flex-1 px-4 py-5 space-y-5 overflow-y-auto pb-10">
        {backupSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 stroke-[3]" />
            <span>{backupSuccessMsg}</span>
          </div>
        )}

        {/* 1. Appearance & Theme */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 space-y-3.5 shadow-xs">
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

        {/* 2. Audio & Haptics Feedback */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 space-y-3.5 shadow-xs">
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

        {/* 3. Currency & Performance */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            <span>Preferences & Currency</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-on-surface block mb-1.5">
                Default Currency Symbol
              </label>
              <div className="grid grid-cols-5 gap-2">
                {['$', '€', '£', '¥', '₹'].map((curr) => (
                  <button
                    key={curr}
                    onClick={() => {
                      onUpdateSettings({ currency: curr });
                      sound.playPop();
                    }}
                    className={`py-2 rounded-xl text-sm font-black font-mono transition-all cursor-pointer ${
                      settings.currency === curr
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface border border-outline-variant/30 text-on-surface'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Low power mode toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface flex items-center justify-center">
                  <BatteryCharging className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-bold text-on-surface block leading-tight">Battery Saver Mode</span>
                  <span className="text-xs text-on-surface-variant">Smooth 60 FPS for older devices</span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={settings.lowPowerMode}
                onChange={(e) => onUpdateSettings({ lowPowerMode: e.target.checked })}
                className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4. Data Backup & Storage */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 space-y-3.5 shadow-xs">
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
                  <span className="text-xs text-on-surface-variant">Save goals to a file</span>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">Export</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3.5 rounded-2xl bg-surface border border-outline-variant/30 hover:bg-surface-container flex items-center justify-between active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <span className="text-sm font-bold text-on-surface block leading-tight">Restore from Backup</span>
                  <span className="text-xs text-on-surface-variant">Import an existing JSON file</span>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">Import</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
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

        {/* 5. App Info */}
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
    </div>
  );
};
