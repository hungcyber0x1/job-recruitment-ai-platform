import PropTypes from 'prop-types';
import React from 'react';
import { motion } from 'framer-motion';

/**
 * MatchProgressBar Component
 * Displays a percentage score with high-quality animations and color grading
 */
const MatchProgressBar = ({
  score,
  label = 'Độ tương thích',
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  // Determine color based on score
  const getColor = (s) => {
    if (s >= 80) return 'from-emerald-400 to-teal-500';
    if (s >= 50) return 'from-amber-400 to-orange-500';
    return 'from-rose-400 to-red-500';
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5';
      case 'lg':
        return 'h-4';
      default:
        return 'h-2.5';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-bold text-gray-700">{label}</span>
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-black text-emerald-600"
          >
            {Math.round(score)}%
          </motion.span>
        </div>
      )}

      <div
        className={`w-full bg-gray-100 rounded-full overflow-hidden ${getHeight()} shadow-inner`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${getColor(score)} rounded-full shadow-lg relative`}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-white/20 skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
        </motion.div>
      </div>

      {score >= 80 && showLabel && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-1.5 text-xs font-bold text-emerald-600 uppercase tracking-widest"
        >
          ✨ Ứng viên tiềm năng cao
        </motion.p>
      )}
    </div>
  );
};

MatchProgressBar.propTypes = {
  score: PropTypes.number.isRequired,
  label: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showLabel: PropTypes.bool,
  className: PropTypes.string,
};

export default MatchProgressBar;
