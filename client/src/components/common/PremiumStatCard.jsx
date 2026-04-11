import React from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Premium Stat Card for Dashboards
 */
const PremiumStatCard = ({
  label,
  value,
  icon: Icon,
  color = 'bg-primary',
  change,
  trend = 'up',
  className,
}) => {
  const isPositive = trend === 'up';

  return (
    <div
      className={cn(
        'group relative bg-white/80 backdrop-blur-xl rounded-2xl p-7 border border-slate-200/50 card-premium-hover cursor-pointer overflow-hidden',
        className
      )}
    >
      {/* Soft Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <div className="relative">
            <div
              className={cn(
                'absolute inset-0 opacity-20 blur-xl rounded-full transition-all duration-500 group-hover:blur-2xl group-hover:opacity-40',
                color
              )}
            />
            <div
              className={cn(
                'relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 border border-slate-100 shadow-sm bg-white',
                color.replace('bg-', 'text-')
              )}
            >
              <Icon size={24} strokeWidth={2} />
            </div>
          </div>

          {change && (
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-sm tracking-wide shadow-sm transition-all duration-500',
                isPositive
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-red-50 text-red-600 border border-red-100'
              )}
            >
              {isPositive ? (
                <TrendingUp size={14} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={14} strokeWidth={2.5} />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-slate-500 text-sm font-medium mb-2 tracking-wider uppercase">
            {label}
          </h3>
          <p className="text-4xl font-semibold text-slate-800 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  );
};

PremiumStatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
  change: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  className: PropTypes.string,
};

export default PremiumStatCard;
