import React from 'react';
import PropTypes from 'prop-types';

/**
 * ScoreCircle - Circular progress indicator for scores
 */
const ScoreCircle = ({ score, maxScore = 100, size = 120, label = 'Score' }) => {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on percentage
  const getColor = (pct) => {
    if (pct >= 80) return '#10B981'; // green
    if (pct >= 60) return '#34d399'; // blue
    if (pct >= 40) return '#F59E0B'; // orange
    return '#EF4444'; // red
  };

  const color = getColor(percentage);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle cx={size / 2} cy={size / 2} r="54" fill="none" stroke="#E5E7EB" strokeWidth="8" />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        {/* Center text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.3em"
          className="text-2xl font-bold transform rotate-90"
          fill="#1F2937"
        >
          {Math.round(score)}
        </text>
      </svg>
      <p className="mt-2 text-sm font-medium text-gray-600">{label}</p>
    </div>
  );
};

ScoreCircle.propTypes = {
  score: PropTypes.number.isRequired,
  maxScore: PropTypes.number,
  size: PropTypes.number,
  label: PropTypes.string,
};

export default ScoreCircle;
