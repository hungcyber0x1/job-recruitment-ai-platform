import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

import { cn } from '@/utils';

export const STAT_CARD_BASE_CLASS =
  'bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md hover:border-gray-300 active:scale-[0.98]';

export const STAT_CARD_ICON_COLORS = {
  primary: 'text-blue-600',
  success: 'text-green-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  neutral: 'text-gray-600',
};

const TYPE_ALIASES = {
  primary: 'primary',
  blue: 'primary',
  sky: 'primary',
  cyan: 'primary',
  info: 'primary',
  success: 'success',
  green: 'success',
  emerald: 'success',
  warning: 'warning',
  amber: 'warning',
  yellow: 'warning',
  orange: 'warning',
  danger: 'danger',
  destructive: 'danger',
  error: 'danger',
  red: 'danger',
  rose: 'danger',
  neutral: 'neutral',
  gray: 'neutral',
  grey: 'neutral',
  slate: 'neutral',
  zinc: 'neutral',
  violet: 'neutral',
  purple: 'neutral',
};

export function getStatCardType(type) {
  const normalizedType = String(type || 'neutral')
    .trim()
    .toLowerCase();
  if (TYPE_ALIASES[normalizedType]) return TYPE_ALIASES[normalizedType];

  if (/blue|sky|cyan|primary|info/.test(normalizedType)) return 'primary';
  if (/green|emerald|success/.test(normalizedType)) return 'success';
  if (/amber|yellow|orange|warning/.test(normalizedType)) return 'warning';
  if (/red|rose|danger|destructive|error/.test(normalizedType)) return 'danger';

  return 'neutral';
}

const renderStatIcon = ({ icon, iconColor, iconClassName }) => {
  if (React.isValidElement(icon)) {
    return React.cloneElement(icon, {
      className: cn('h-5 w-5', iconColor, icon.props.className, iconClassName),
      strokeWidth: icon.props.strokeWidth ?? 2,
    });
  }

  const Icon = icon || Briefcase;
  return <Icon className={cn('h-5 w-5', iconColor, iconClassName)} strokeWidth={2} />;
};

const StatCard = ({
  title,
  label,
  value,
  subtitle,
  helper,
  description,
  icon,
  type,
  tone,
  color,
  variant,
  loading = false,
  trend,
  trendValue,
  trendLabel,
  badge,
  active = false,
  disabled = false,
  onClick,
  to,
  className,
  iconClassName,
  titleClassName,
  valueClassName,
  subtitleClassName,
  children,
}) => {
  const displayTitle = title || label;
  const displaySubtitle = subtitle ?? helper ?? description;
  const displayValue = loading ? '—' : (value ?? '—');
  const displayTrend =
    trendValue ||
    (typeof trend === 'string' && !['up', 'down', 'neutral'].includes(trend) ? trend : '');
  const iconType = getStatCardType(type || tone || color || variant);
  const iconColor = STAT_CARD_ICON_COLORS[iconType] || STAT_CARD_ICON_COLORS.neutral;
  const interactive = Boolean(onClick || to);

  const content = (
    <>
      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {displayTitle ? (
            <p className={cn('text-sm font-semibold leading-5 text-gray-700', titleClassName)}>
              {displayTitle}
            </p>
          ) : null}
          <p
            className={cn(
              'mt-2 text-2xl font-bold leading-none tracking-tight text-gray-950 tabular-nums',
              valueClassName
            )}
          >
            {displayValue}
          </p>
          {displaySubtitle ? (
            <p className={cn('mt-2 text-sm leading-5 text-gray-500', subtitleClassName)}>
              {displaySubtitle}
            </p>
          ) : null}

          {(displayTrend || trendLabel || badge) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
              {displayTrend || trendLabel ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                  {displayTrend}
                  {trendLabel ? <span>{trendLabel}</span> : null}
                </span>
              ) : null}
              {badge ? (
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-gray-600">
                  {badge}
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          {renderStatIcon({ icon, iconColor, iconClassName })}
        </div>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </>
  );

  const rootClassName = cn(
    STAT_CARD_BASE_CLASS,
    active && 'border-gray-300 shadow-md ring-1 ring-gray-200',
    interactive && 'cursor-pointer text-left',
    disabled && 'cursor-not-allowed opacity-60 hover:translate-y-0 active:scale-100',
    className
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={cn('block h-full', rootClassName)}>
        {content}
      </Link>
    );
  }

  if (onClick || disabled) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={interactive ? active : undefined}
        className={cn('h-full w-full', rootClassName)}
      >
        {content}
      </button>
    );
  }

  return <div className={rootClassName}>{content}</div>;
};

StatCard.propTypes = {
  title: PropTypes.node,
  label: PropTypes.node,
  value: PropTypes.node,
  subtitle: PropTypes.node,
  helper: PropTypes.node,
  description: PropTypes.node,
  icon: PropTypes.oneOfType([PropTypes.elementType, PropTypes.element]),
  type: PropTypes.string,
  tone: PropTypes.string,
  color: PropTypes.string,
  variant: PropTypes.string,
  loading: PropTypes.bool,
  trend: PropTypes.node,
  trendValue: PropTypes.node,
  trendLabel: PropTypes.node,
  badge: PropTypes.node,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  to: PropTypes.string,
  className: PropTypes.string,
  iconClassName: PropTypes.string,
  titleClassName: PropTypes.string,
  valueClassName: PropTypes.string,
  subtitleClassName: PropTypes.string,
  children: PropTypes.node,
};

export default StatCard;
