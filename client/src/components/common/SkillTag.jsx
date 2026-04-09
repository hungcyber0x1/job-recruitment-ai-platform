import React from 'react';
import PropTypes from 'prop-types';

/**
 * SkillTag - Display skill with proficiency level
 * Color-coded chip for skills
 */
const SkillTag = ({
  skill,
  proficiency = null,
  size = 'medium',
  showProficiency = true,
  onRemove = null,
}) => {
  // Proficiency colors
  const proficiencyColors = {
    beginner: 'bg-secondary-100 text-txt-muted border-secondary-300',
    intermediate: 'bg-primary-100 text-primary-700 border-primary-400',
    advanced: 'bg-accent-100 text-accent-700 border-accent-400',
    expert: 'bg-success-100 text-success-700 border-success-400',
  };

  // Size configurations
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-1.5 text-base',
  };

  const colorClass =
    proficiency && proficiencyColors[proficiency]
      ? proficiencyColors[proficiency]
      : 'bg-primary-50 text-primary-700 border-primary-200';

  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClass} ${sizeClass} font-medium`}
    >
      <span>{skill}</span>

      {showProficiency && proficiency && (
        <span className="text-xs opacity-75">({proficiency})</span>
      )}

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(skill);
          }}
          className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
          title="Remove skill"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

SkillTag.propTypes = {
  skill: PropTypes.string.isRequired,
  proficiency: PropTypes.oneOf(['beginner', 'intermediate', 'advanced', 'expert']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showProficiency: PropTypes.bool,
  onRemove: PropTypes.func,
};

export default SkillTag;
