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
} from 'lucide-react';

export interface IconOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

export const AVAILABLE_GOAL_ICONS: IconOption[] = [
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
