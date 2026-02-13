'use client';

import { isToday } from '@lifespan/utils';

interface DayCircleProps {
  date: string;
  color?: string | null;
  imageUrl?: string | null;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
} as const;

export function DayCircle({ date, color, imageUrl, selected, disabled, size = 'md', label, onClick }: DayCircleProps) {
  const today = isToday(date);
  const hasImage = !!imageUrl;
  const hasColor = !!color;
  const clickable = !!onClick && !disabled;

  const classes = `
    ${sizeClasses[size]} rounded-full border-2 transition-all overflow-hidden
    ${clickable ? 'cursor-pointer hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1' : 'cursor-default'}
    ${today ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''}
    ${selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface scale-110' : ''}
    ${hasImage || hasColor ? 'border-transparent' : 'border-edge bg-surface-secondary'}
    ${disabled ? 'opacity-40' : ''}
  `;

  const inlineStyle = !hasImage && hasColor ? { backgroundColor: color!, borderColor: color! } : undefined;

  const content = hasImage ? (
    <img src={imageUrl!} alt="" className="h-full w-full object-cover" />
  ) : null;

  if (!onClick) {
    return (
      <div title={label} className={classes} style={inlineStyle}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={disabled}
      title={label}
      className={classes}
      style={inlineStyle}
    >
      {content}
    </button>
  );
}
