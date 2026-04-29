import PropTypes from 'prop-types';
import React from 'react';

const SkeletonCard = ({ variant = 'default' }) => {
  if (variant === 'job') {
    return (
      <div className="animate-pulse bg-white rounded-xl border border-slate-100 p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 bg-slate-200 rounded-xl"></div>
          <div className="flex-1">
            <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-slate-200 rounded-full w-16"></div>
          <div className="h-6 bg-slate-200 rounded-full w-20"></div>
          <div className="h-6 bg-slate-200 rounded-full w-24"></div>
        </div>

        {/* Description */}
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-slate-200 rounded w-full"></div>
          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
          <div className="h-3 bg-slate-200 rounded w-4/6"></div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="h-9 bg-slate-200 rounded-lg w-28"></div>
        </div>
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div className="animate-pulse bg-white rounded-xl border border-slate-100 p-6">
        <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"></div>
        <div className="h-8 bg-slate-200 rounded w-20 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-24"></div>
      </div>
    );
  }

  if (variant === 'feature') {
    return (
      <div className="animate-pulse bg-white rounded-xl border border-slate-100 p-8">
        <div className="w-14 h-14 bg-slate-200 rounded-xl mb-6"></div>
        <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-full"></div>
          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  // Default skeleton
  return (
    <div className="animate-pulse bg-white rounded-xl border border-slate-100 p-6">
      <div className="h-48 bg-slate-200 rounded-xl mb-4"></div>
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
    </div>
  );
};

SkeletonCard.propTypes = {
  variant: PropTypes.oneOf(['default', 'job', 'stat', 'feature']),
};

export default SkeletonCard;
