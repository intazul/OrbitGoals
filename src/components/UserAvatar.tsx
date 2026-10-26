import React, { useState } from 'react';
import { resolveAvatarUrl } from '../utils/avatars';

interface UserAvatarProps {
  avatarId?: string;
  avatarUrl?: string;
  fallbackText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
  alt?: string;
}

const SIZE_MAP = {
  xs: 'w-7 h-7 text-[10px] rounded-xl',
  sm: 'w-9 h-9 text-xs rounded-xl',
  md: 'w-11 h-11 text-sm rounded-2xl',
  lg: 'w-16 h-16 text-xl rounded-2xl',
  xl: 'w-20 h-20 text-2xl rounded-3xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarId,
  avatarUrl,
  fallbackText = 'OG',
  size = 'md',
  className = '',
  showBorder = true,
  alt = 'User profile avatar',
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = resolveAvatarUrl({ avatarId, avatarUrl });
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const borderClass = showBorder ? 'ring-2 ring-primary/25 border border-surface shadow-xs' : '';

  if (hasError || !resolvedUrl) {
    return (
      <div
        className={`${sizeClass} ${borderClass} bg-gradient-to-tr from-primary to-primary-container text-on-primary font-black flex items-center justify-center shrink-0 uppercase select-none ${className}`}
        aria-label={alt}
      >
        {fallbackText ? fallbackText.slice(0, 2) : 'OG'}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden shrink-0 ${sizeClass} ${borderClass} bg-surface-container-high ${className}`}
    >
      <img
        src={resolvedUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover select-none transition-transform duration-300"
      />
    </div>
  );
};
