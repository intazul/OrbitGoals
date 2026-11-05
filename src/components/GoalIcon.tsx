import React from 'react';
import {
  Youtube,
  Instagram,
  Facebook,
  Target,
  Dumbbell,
  DollarSign,
  BookOpen,
  Droplets,
  Trophy,
  Briefcase,
  Heart,
  Star,
  Video,
  Footprints,
} from 'lucide-react';

export const NamazIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-4 h-4', style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Base foundation line */}
    <path d="M2 21h20" />
    {/* Main Mosque Dome */}
    <path d="M7 21v-7c0-2.8 2.2-5 5-5s5 2.2 5 5v7" />
    {/* Mihrab / Sacred Archway */}
    <path d="M10 21v-3.5a2 2 0 0 1 4 0V21" />
    {/* Left Minaret */}
    <path d="M3 21V9l1.5-2L6 9v12" />
    {/* Right Minaret */}
    <path d="M18 21V9l1.5-2L21 9v12" />
    {/* Dome Finial with Crescent Moon */}
    <path d="M12 9V5" />
    <path d="M13.2 4a1.8 1.8 0 1 1-2.2-1.4 1.5 1.5 0 0 0 2.2 1.4z" fill="currentColor" />
  </svg>
);

export interface IconOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

export const AVAILABLE_GOAL_ICONS: IconOption[] = [
  { id: 'namaz', label: 'Namaz / Salah', icon: NamazIcon, color: '#10b981' },
  { id: 'prayer', label: 'Daily Prayer', icon: NamazIcon, color: '#059669' },
  { id: 'steps', label: 'Steps Pedometer', icon: Footprints, color: '#3b82f6' },
  { id: 'walk', label: 'Walking & Steps', icon: Footprints, color: '#06b6d4' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: '#ef4444' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#ec4899' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: '#3b82f6' },
  { id: 'target', label: 'Target', icon: Target, color: '#8b5cf6' },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: '#10b981' },
  { id: 'finance', label: 'Money', icon: DollarSign, color: '#059669' },
  { id: 'book', label: 'Reading', icon: BookOpen, color: '#f97316' },
  { id: 'water', label: 'Water', icon: Droplets, color: '#06b6d4' },
  { id: 'trophy', label: 'Trophy', icon: Trophy, color: '#eab308' },
  { id: 'briefcase', label: 'Work', icon: Briefcase, color: '#6366f1' },
  { id: 'heart', label: 'Health', icon: Heart, color: '#f43f5e' },
  { id: 'star', label: 'Milestone', icon: Star, color: '#f59e0b' },
  { id: 'video', label: 'Video', icon: Video, color: '#dc2626' },
];

interface GoalIconProps {
  iconId?: string;
  className?: string;
  color?: string;
}

export const GoalIcon: React.FC<GoalIconProps> = ({ iconId = 'target', className = 'w-4 h-4', color }) => {
  const matched = AVAILABLE_GOAL_ICONS.find((item) => item.id.toLowerCase() === iconId.toLowerCase());
  const IconComponent = matched ? matched.icon : Target;
  const iconColor = color || matched?.color;

  return <IconComponent className={className} style={iconColor ? { color: iconColor } : undefined} />;
};
