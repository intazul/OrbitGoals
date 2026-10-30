import React, { useState, useRef } from 'react';
import { TimeCapsule, CapsuleCategory, Goal, Habit, UserProfile } from '../types';
import { sound, triggerHaptic } from '../utils/sound';
import {
  ArrowLeft,
  Plus,
  Camera,
  Trash2,
  Share2,
  Sparkles,
  Calendar,
  CheckCircle2,
  Trophy,
  Target,
  Flame,
  Zap,
  Star,
  X,
  Copy,
  Check,
  Image as ImageIcon,
  Heart,
  Quote,
} from 'lucide-react';

interface ScrapbookScreenProps {
  capsules: TimeCapsule[];
  goals: Goal[];
  habits: Habit[];
  profile: UserProfile;
  onBack: () => void;
  onAddCapsule: (capsule: Omit<TimeCapsule, 'id' | 'createdAt'>) => void;
  onDeleteCapsule: (id: string) => void;
}

const CATEGORY_META: Record<
  CapsuleCategory,
  { label: string; icon: typeof Trophy; color: string; bg: string; border: string }
> = {
  milestone: {
    label: 'Milestone',
    icon: Trophy,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  goal: {
    label: 'Goal Achieved',
    icon: Target,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  streak: {
    label: 'Habit Streak',
    icon: Flame,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  level: {
    label: 'Level Up',
    icon: Zap,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  win: {
    label: 'Personal Win',
    icon: Star,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
};

const STICKER_PRESETS = ['🚀', '🏆', '💎', '👑', '🔥', '⚡', '🎯', '🌟', '🌈', '🥇', '🧘', '📚'];

export const ScrapbookScreen: React.FC<ScrapbookScreenProps> = ({
  capsules,
  goals,
  habits,
  profile,
  onBack,
  onAddCapsule,
  onDeleteCapsule,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | CapsuleCategory>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [sharingCapsule, setSharingCapsule] = useState<TimeCapsule | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New capsule form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<CapsuleCategory>('milestone');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formReflection, setFormReflection] = useState('');
  const [formSticker, setFormSticker] = useState<string>('🚀');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string | undefined>(undefined);
  const [formLinkedGoal, setFormLinkedGoal] = useState<string>('');
  const [formLinkedHabit, setFormLinkedHabit] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCapsules = capsules.filter((c) => {
    if (selectedCategory === 'all') return true;
    return c.category === selectedCategory;
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo is too large! Please choose an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormPhotoUrl(reader.result);
        sound.playPop();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    onAddCapsule({
      title: formTitle.trim(),
      category: formCategory,
      date: formDate || new Date().toISOString().split('T')[0],
      reflection: formReflection.trim(),
      sticker: formSticker,
      photoUrl: formPhotoUrl,
      linkedGoalTitle: formLinkedGoal ? formLinkedGoal : undefined,
      linkedHabitTitle: formLinkedHabit ? formLinkedHabit : undefined,
      xpBonus: 100,
    });

    // Reset form
    setFormTitle('');
    setFormReflection('');
    setFormPhotoUrl(undefined);
    setFormLinkedGoal('');
    setFormLinkedHabit('');
    setFormSticker('🚀');
    setIsAdding(false);

    sound.playSuccessChime();
    triggerHaptic('success');
  };

  const handleCopyStory = (capsule: TimeCapsule) => {
    const text = `🌟 OrbitGoals Victory Capsule 📸\n\n"${capsule.title}"\n📅 ${capsule.date}\n👤 ${profile.name || 'Achiever'}\n\n"${capsule.reflection || 'Crushed another milestone on OrbitGoals!'}"\n\n🚀 Track habits & goals on OrbitGoals!`;
    navigator.clipboard?.writeText(text);
    setCopiedToast(true);
    sound.playPop();
    triggerHaptic('light');
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface text-on-surface overflow-hidden">
      {/* Top Header */}
      <header
        style={{ marginTop: '32px', marginLeft: '0px' }}
        className="px-4 mt-8 pt-6 pb-3 border-b border-outline-variant/20 flex items-center justify-between shrink-0 bg-surface/90 backdrop-blur-md z-10"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer border border-outline-variant/30"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[18px] font-black tracking-tight text-on-surface leading-none whitespace-nowrap">
              Growth Scrapbook
            </h1>
          </div>
        </div>

        {/* Add Memory Button */}
        <button
          type="button"
          onClick={() => {
            setIsAdding(true);
            sound.playPop();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Memory</span>
        </button>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-24">
        {/* Hero KPI Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-surface-container-low border border-primary/20 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                Victory Reel & Milestones
              </span>
              <h2 className="text-xl font-black text-on-surface tracking-tight">
                {capsules.length} Time Capsule{capsules.length === 1 ? '' : 's'}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-lg border border-primary/30">
              📸
            </div>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            Record memorable milestones, goal victories, and streak breakthroughs. Every saved memory rewards you with <span className="font-bold text-amber-600 dark:text-amber-400">+100 XP</span>!
          </p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: `All (${capsules.length})` },
            { id: 'milestone', label: '🏆 Milestones' },
            { id: 'goal', label: '🎯 Goals' },
            { id: 'streak', label: '🔥 Streaks' },
            { id: 'level', label: '⚡ Level Ups' },
            { id: 'win', label: '🌟 Wins' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id as typeof selectedCategory);
                sound.playPop();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-primary text-on-primary border-primary shadow-xs'
                  : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Timeline of Time Capsules */}
        <div className="space-y-3 pt-1">
          {filteredCapsules.map((capsule) => {
            const meta = CATEGORY_META[capsule.category] || CATEGORY_META.milestone;
            const CategoryIcon = meta.icon;

            return (
              <div
                key={capsule.id}
                className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/30 shadow-xs space-y-3 transition-all hover:border-primary/40"
              >
                {/* Header row: Badge, Date, Share, Delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${meta.bg} ${meta.color} ${meta.border}`}
                    >
                      <CategoryIcon className="w-3 h-3 stroke-[2.5]" />
                      <span>{meta.label}</span>
                    </span>

                    <span className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-on-surface-variant/70" />
                      <span>{formatDate(capsule.date)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Share Story Card Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSharingCapsule(capsule);
                        sound.playPop();
                      }}
                      className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 transition-all border border-outline-variant/20 cursor-pointer"
                      title="Share Story Card"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Capsule Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(capsule.id)}
                      className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-on-surface-variant hover:text-red-500 active:scale-95 transition-all border border-outline-variant/20 cursor-pointer"
                      title="Delete Memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Capsule Visual: Photo or Sticker */}
                {capsule.photoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden max-h-48 bg-black/10 border border-outline-variant/20">
                    <img
                      src={capsule.photoUrl}
                      alt={capsule.title}
                      className="w-full h-44 object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                      📸 Memory Photo
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-outline-variant/20">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                      {capsule.sticker || '🏆'}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                        Milestone Badge
                      </span>
                      <span className="text-xs font-bold text-on-surface truncate block">
                        Celebrated with {capsule.sticker || '🏆'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <h3 className="text-base font-black text-on-surface tracking-tight leading-tight">
                    {capsule.title}
                  </h3>

                  {(capsule.linkedGoalTitle || capsule.linkedHabitTitle) && (
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {capsule.linkedGoalTitle && (
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Target className="w-2.5 h-2.5" />
                          <span>Goal: {capsule.linkedGoalTitle}</span>
                        </span>
                      )}
                      {capsule.linkedHabitTitle && (
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5" />
                          <span>Habit: {capsule.linkedHabitTitle}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Reflection Note */}
                {capsule.reflection && (
                  <div className="p-3 rounded-2xl bg-surface border border-outline-variant/20 relative space-y-1">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-[10px] font-black uppercase tracking-wider">
                      <Quote className="w-3 h-3 text-primary stroke-[3]" />
                      <span>Reflection & Memory Note</span>
                    </div>
                    <p className="text-xs text-on-surface font-medium leading-relaxed italic">
                      "{capsule.reflection}"
                    </p>
                  </div>
                )}

                {/* Bottom Reward Pill */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-outline-variant/15 text-on-surface-variant font-medium">
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>+{capsule.xpBonus || 100} XP Earned</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopyStory(capsule)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredCapsules.length === 0 && (
            <div className="text-center py-12 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/40 p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl">
                📸
              </div>
              <h3 className="text-base font-black text-on-surface">No memories saved yet</h3>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                Add your first growth milestone, personal breakthrough, or photo victory to begin your timeline.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(true);
                  sound.playPop();
                }}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create First Memory</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NEW MEMORY BOTTOM SHEET MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0">
          <div className="w-full max-w-[430px] bg-surface border-t border-outline-variant/30 rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">📸</span>
                <h3 className="text-base font-black text-on-surface">New Time Capsule Memory</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30-Day Fitness Streak, Published 20th Video!"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">
                  Milestone Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'milestone', label: '🏆 Milestone' },
                      { id: 'goal', label: '🎯 Goal Win' },
                      { id: 'streak', label: '🔥 Streak' },
                      { id: 'level', label: '⚡ Level Up' },
                      { id: 'win', label: '🌟 Personal Win' },
                    ] as { id: CapsuleCategory; label: string }[]
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormCategory(cat.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                        formCategory === cat.id
                          ? 'bg-primary text-on-primary border-primary shadow-xs'
                          : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">
                  Date of Milestone
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Photo Upload Option */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-on-surface">
                    Photo Attachment (Optional)
                  </label>
                  {formPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormPhotoUrl(undefined)}
                      className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {formPhotoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-primary/30 max-h-40">
                    <img src={formPhotoUrl} alt="Preview" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Change</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 px-3 rounded-2xl bg-surface-container border-2 border-dashed border-outline-variant/40 hover:border-primary flex flex-col items-center justify-center gap-1.5 text-on-surface-variant cursor-pointer transition-colors"
                  >
                    <Camera className="w-6 h-6 text-primary" />
                    <span className="text-xs font-bold text-on-surface">Upload Memory Photo</span>
                    <span className="text-[10px] text-on-surface-variant">
                      JPG, PNG from device camera or gallery
                    </span>
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Sticker Selector (when no photo or as companion badge) */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">
                  Celebration Sticker
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {STICKER_PRESETS.map((stk) => (
                    <button
                      key={stk}
                      type="button"
                      onClick={() => setFormSticker(stk)}
                      className={`w-10 h-10 rounded-2xl text-lg flex items-center justify-center transition-all cursor-pointer border ${
                        formSticker === stk
                          ? 'bg-primary/20 border-primary scale-110 shadow-xs'
                          : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
                      }`}
                    >
                      {stk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reflection Note */}
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1.5">
                  Your Reflection & Thoughts
                </label>
                <textarea
                  rows={3}
                  placeholder="What made this moment unforgettable? What did you learn?"
                  value={formReflection}
                  onChange={(e) => setFormReflection(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-xs font-medium text-on-surface focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Link to Goal / Habit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                    Link to Goal (Optional)
                  </label>
                  <select
                    value={formLinkedGoal}
                    onChange={(e) => setFormLinkedGoal(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none"
                  >
                    <option value="">None</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.title}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                    Link to Habit (Optional)
                  </label>
                  <select
                    value={formLinkedHabit}
                    onChange={(e) => setFormLinkedHabit(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-none"
                  >
                    <option value="">None</option>
                    {habits.map((h) => (
                      <option key={h.id} value={h.title}>
                        {h.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 pb-4 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-primary text-on-primary font-black text-sm shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Save to Scrapbook (+100 XP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-surface-container text-on-surface font-bold text-xs hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE STORY CARD MODAL */}
      {sharingCapsule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-surface border border-outline-variant/40 rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Story Card Preview */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 via-surface-container-high to-surface border border-primary/30 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center font-black text-xs">
                    {profile.name ? profile.name.trim().charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div>
                    <span className="text-xs font-black text-on-surface block leading-tight">
                      {profile.name || 'OrbitGoals Achiever'}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                      {profile.title || 'Novice Achiever'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  OrbitGoals
                </span>
              </div>

              {sharingCapsule.photoUrl ? (
                <div className="rounded-xl overflow-hidden max-h-36 border border-outline-variant/20">
                  <img
                    src={sharingCapsule.photoUrl}
                    alt={sharingCapsule.title}
                    className="w-full h-32 object-cover"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl mx-auto my-2">
                  {sharingCapsule.sticker || '🏆'}
                </div>
              )}

              <div className="text-center space-y-1">
                <h4 className="text-base font-black text-on-surface leading-tight">
                  {sharingCapsule.title}
                </h4>
                {sharingCapsule.reflection && (
                  <p className="text-xs text-on-surface-variant italic leading-relaxed">
                    "{sharingCapsule.reflection}"
                  </p>
                )}
                <span className="text-[10px] text-on-surface-variant font-bold block pt-1">
                  📅 {formatDate(sharingCapsule.date)}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopyStory(sharingCapsule)}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:brightness-105 active:scale-98 transition-all cursor-pointer"
              >
                {copiedToast ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedToast ? 'Story Copied!' : 'Copy Victory Text'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSharingCapsule(null)}
                className="w-full py-2 px-4 rounded-xl bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/30 rounded-3xl p-5 max-w-xs w-full space-y-3 shadow-xl">
            <h4 className="text-sm font-black text-on-surface">Delete this memory?</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              This capsule will be removed from your Growth Scrapbook.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onDeleteCapsule(deleteConfirmId);
                  setDeleteConfirmId(null);
                  sound.playPop();
                }}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-xs hover:brightness-105 active:scale-98 transition-all cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Copied Toast */}
      {copiedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-primary text-on-primary font-bold text-xs shadow-lg flex items-center gap-1.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>Victory summary copied!</span>
        </div>
      )}
    </div>
  );
};
