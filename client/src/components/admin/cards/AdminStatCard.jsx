/**
 * AdminStatCard — Enhanced Statistics Card with Modern Design
 * Features:
 * - Gradient backgrounds with glassmorphism effects
 * - Animated entrance and hover effects
 * - Progress indicator for metrics
 * - Trend comparison with visual indicators
 */
import React from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils';

const AdminStatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  badge,
  description,
  color = 'emerald',
  progress,
  progressLabel,
  className,
  delay = 0,
}) => {
  const colorSchemes = {
    emerald: {
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      iconText: 'text-white',
      accent: 'text-emerald-500',
      progress: 'bg-emerald-500',
      trendUp: 'text-emerald-500',
      trendDown: 'text-red-500',
    },
    blue: {
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconText: 'text-white',
      accent: 'text-blue-500',
      progress: 'bg-blue-500',
      trendUp: 'text-emerald-500',
      trendDown: 'text-red-500',
    },
    amber: {
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
      iconText: 'text-white',
      accent: 'text-amber-500',
      progress: 'bg-amber-500',
      trendUp: 'text-emerald-500',
      trendDown: 'text-red-500',
    },
    violet: {
      gradient: 'from-violet-500/10 via-violet-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-violet-500 to-violet-600',
      iconText: 'text-white',
      accent: 'text-violet-500',
      progress: 'bg-violet-500',
      trendUp: 'text-emerald-500',
      trendDown: 'text-red-500',
    },
    red: {
      gradient: 'from-red-500/10 via-red-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
      iconText: 'text-white',
      accent: 'text-red-500',
      progress: 'bg-red-500',
      trendUp: 'text-emerald-500',
      trendDown: 'text-red-500',
    },
    rose: {
      gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-rose-500 to-rose-600',
      iconText: 'text-white',
      accent: 'text-rose-500',
      progress: 'bg-rose-500',
      trendUp: 'text-emerald-500',
      trendDown: 'text-red-500',
    },
    cyan: {
      gradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      iconText: 'text-white',
      accent: 'text-cyan-500',
      progress: 'bg-cyan-500',
      trendUp: 'text-emerald-500',
      trendDown: 'text-red-500',
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.emerald;
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  const isNeutral = trend === 'neutral' || !trend;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6',
        'shadow-sm transition-[border-color,box-shadow,transform] duration-200 ease-out',
        'hover:border-primary/20 hover:shadow-md hover:-translate-y-px',
        'animate-in fade-in slide-in-from-bottom-4',
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationDuration: '400ms' }}
    >
      {/* Background gradient on hover */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          scheme.gradient
        )}
      />

      {/* Content */}
      <div className="relative">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {value}
            </p>
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* Icon */}
            <div
              className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm',
              'transition-transform duration-200 group-hover:scale-[1.02]',
              scheme.iconBg
            )}
          >
            <Icon className={cn('h-5 w-5', scheme.iconText)} />
          </div>
        </div>

        {/* Footer row */}
        <div className="mt-4 flex items-center justify-between">
          {/* Trend */}
          {trendValue && (
            <div className="flex items-center gap-1.5">
              {isPositive && <TrendingUp className={cn('h-4 w-4', scheme.trendUp)} />}
              {isNegative && <TrendingDown className={cn('h-4 w-4', scheme.trendDown)} />}
              {isNeutral && <Minus className="h-4 w-4 text-slate-400" />}
              <span
                className={cn(
                  'text-sm font-semibold',
                  isPositive && scheme.trendUp,
                  isNegative && scheme.trendDown,
                  isNeutral && 'text-slate-400'
                )}
              >
                {trendValue}
              </span>
              {trend && (
                <span className="text-xs text-muted-foreground ml-1">
                  vs last period
                </span>
              )}
            </div>
          )}

          {/* Badge */}
          {badge && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted/80 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm">
              {badge}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {typeof progress === 'number' && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{progressLabel || 'Progress'}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full transition-all duration-500 ease-out', scheme.progress)}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Decorative corner accent */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 opacity-0 blur-2xl transition-opacity duration-200 group-hover:opacity-100" />
    </div>
  );
};

AdminStatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  trendValue: PropTypes.string,
  badge: PropTypes.string,
  description: PropTypes.string,
  color: PropTypes.oneOf(['emerald', 'blue', 'amber', 'violet', 'red', 'rose', 'cyan']),
  progress: PropTypes.number,
  progressLabel: PropTypes.string,
  className: PropTypes.string,
  delay: PropTypes.number,
};

export default AdminStatCard;
