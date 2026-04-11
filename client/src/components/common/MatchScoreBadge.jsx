import React from 'react';
import PropTypes from 'prop-types';

/**
 * MatchScoreBadge - Displays job-candidate match score
 * Color-coded circular badge with percentage
 */
const MatchScoreBadge = ({ score, size = 'medium', showLabel = true }) => {
  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 85) return 'green';
    if (score >= 70) return 'blue';
    if (score >= 55) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  };

  // Determine match type text
  const getMatchType = (score) => {
    if (score >= 90) return 'Perfect Match';
    if (score >= 75) return 'Strong Match';
    if (score >= 60) return 'Good Match';
    if (score >= 45) return 'Possible Match';
    return 'Weak Match';
  };

  const color = getScoreColor(score);
  const matchType = getMatchType(score);

  // Size configurations
  const sizeConfig = {
    small: { width: '40px', height: '40px', fontSize: '12px', labelSize: 'text-sm' },
    medium: { width: '60px', height: '60px', fontSize: '16px', labelSize: 'text-sm' },
    large: { width: '80px', height: '80px', fontSize: '20px', labelSize: 'text-base' },
  };

  const config = sizeConfig[size];

  // Color classes
  const colorClasses = {
    green: 'bg-success-100 text-success-700 border-success-500',
    blue: 'bg-primary-100 text-primary-700 border-primary-500',
    yellow: 'bg-warning-100 text-warning-700 border-warning-500',
    orange: 'bg-orange-100 text-orange-700 border-orange-500', // Keeps orange if strict warning doesn't fit
    red: 'bg-error-100 text-error-700 border-error-500',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex items-center justify-center rounded-full border-4 font-bold ${colorClasses[color]}`}
        style={{ width: config.width, height: config.height, fontSize: config.fontSize }}
        title={`${matchType}: ${score}% compatible`}
      >
        {Math.round(score)}%
      </div>
      {showLabel && (
        <span className={`${config.labelSize} font-medium text-txt-muted`}>{matchType}</span>
      )}
    </div>
  );
};

MatchScoreBadge.propTypes = {
  score: PropTypes.number.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showLabel: PropTypes.bool,
};

export default MatchScoreBadge;
