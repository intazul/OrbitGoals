export interface AvatarPreset {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  accentColor: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'cosmic-astronaut',
    name: 'Cosmic Voyager',
    subtitle: 'Deep Orbit Pioneer',
    url: '/src/assets/images/avatar_cosmic_astronaut_1793019967563.jpg',
    accentColor: '#6366f1',
  },
  {
    id: 'cyber-pilot',
    name: 'Cyber Pilot',
    subtitle: 'High-Tech Focus',
    url: '/src/assets/images/avatar_cyber_pilot_1793019967596.jpg',
    accentColor: '#06b6d4',
  },
  {
    id: 'phoenix-blaze',
    name: 'Phoenix Champion',
    subtitle: 'Streak Igniter',
    url: '/src/assets/images/avatar_phoenix_rider_1793019968543.jpg',
    accentColor: '#f97316',
  },
  {
    id: 'zen-master',
    name: 'Zen Master',
    subtitle: 'Mindful Serenity',
    url: '/src/assets/images/avatar_zen_monk_1793019967364.jpg',
    accentColor: '#10b981',
  },
  {
    id: 'creator-studio',
    name: 'Studio Creator',
    subtitle: 'Content & Craft',
    url: '/src/assets/images/avatar_creator_master_1792734990553.jpg',
    accentColor: '#8b5cf6',
  },
  {
    id: 'fitness-champion',
    name: 'Titan Athlete',
    subtitle: 'Daily Discipline',
    url: '/src/assets/images/avatar_fitness_champion_1792734990718.jpg',
    accentColor: '#14b8a6',
  },
  {
    id: 'wealth-builder',
    name: 'Wealth Architect',
    subtitle: 'Long-term Growth',
    url: '/src/assets/images/avatar_wealth_builder_1792734991678.jpg',
    accentColor: '#f59e0b',
  },
];

export const DEFAULT_AVATAR_ID = 'cosmic-astronaut';

export function getAvatarPreset(avatarId?: string): AvatarPreset {
  if (!avatarId) return AVATAR_PRESETS[0];
  const found = AVATAR_PRESETS.find((p) => p.id === avatarId);
  return found || AVATAR_PRESETS[0];
}

export function resolveAvatarUrl(profile?: {
  avatarId?: string;
  avatarUrl?: string;
  avatarBaseImage?: string;
}): string {
  if (profile?.avatarUrl) return profile.avatarUrl;
  if (profile?.avatarBaseImage) return profile.avatarBaseImage;
  if (profile?.avatarId) {
    const preset = AVATAR_PRESETS.find((p) => p.id === profile.avatarId);
    if (preset) return preset.url;
  }
  return AVATAR_PRESETS[0].url;
}
