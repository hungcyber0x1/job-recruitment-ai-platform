import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utils/index';
import { PROFICIENCY_CONFIG } from '@/constants/candidateProfile';

const SkillBadge = ({
  name,
  proficiency_level,
  years_experience,
  is_primary,
  size = 'md',
  onRemove,
  onEdit,
}) => {
  const config = PROFICIENCY_CONFIG[proficiency_level] || PROFICIENCY_CONFIG.beginner;
  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1'
      : size === 'lg'
        ? 'px-4 py-2 text-base gap-2'
        : 'px-3 py-1.5 text-sm gap-1.5';

  return (
    <div
      className={cn(
        'group flex items-center rounded-full font-medium transition-all',
        config.bg,
        config.text,
        'border',
        sizeClass,
        onRemove || onEdit ? 'pr-1' : 'px-3',
        is_primary && 'ring-2 ring-emerald-400/40'
      )}
    >
      {is_primary && <Star className="h-3 w-3 fill-current shrink-0" />}
      <span className="font-semibold">{name}</span>

      {proficiency_level && size !== 'sm' && (
        <span className={cn('text-xs font-bold opacity-70')}>{config.short}</span>
      )}

      {years_experience != null && size !== 'sm' && (
        <span className="text-xs opacity-60">{years_experience}y</span>
      )}

      {(onRemove || onEdit) && (
        <div className="ml-1 flex items-center gap-0.5">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="hidden rounded-md p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/10"
            >
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="hidden rounded-md p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/10 hover:text-red-500"
            >
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillBadge;
