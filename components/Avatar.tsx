import React from 'react';
import { UserIcon } from './icons';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  showPlusBadge?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 text-xl',
};

const BADGE_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-4 w-4 text-[10px]',
  md: 'h-4 w-4 text-[10px]',
  lg: 'h-5 w-5 text-xs',
  xl: 'h-6 w-6 text-sm',
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  showPlusBadge = false,
  className,
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const badgeSizeClass = BADGE_SIZE_CLASSES[size];

  return (
    <div className={`relative inline-flex ${className || ''}`}>
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-slate-700`}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" loading="lazy" />
        ) : name.trim() ? (
          <span className="font-bold text-slate-700 dark:text-slate-200">{getInitials(name)}</span>
        ) : (
          <UserIcon className="w-2/3 h-2/3 text-slate-500 dark:text-slate-300" />
        )}
      </div>
      {showPlusBadge && (
        <span
          className={`absolute -bottom-1 -right-1 bg-gradient-to-tr from-yellow-400 to-orange-500 text-white rounded-full ${badgeSizeClass} flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-800 shadow-sm`}
        >
          +
        </span>
      )}
    </div>
  );
};

export default Avatar;
