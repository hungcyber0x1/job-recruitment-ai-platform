import React from 'react';
import PropTypes from 'prop-types';

import StatCard from '@/components/common/StatCard';
import { cn } from '@/utils';

const PROGRESS_COLORS = {
  primary: 'bg-blue-600',
  blue: 'bg-blue-600',
  sky: 'bg-blue-600',
  cyan: 'bg-blue-600',
  success: 'bg-green-600',
  emerald: 'bg-green-600',
  green: 'bg-green-600',
  warning: 'bg-amber-600',
  amber: 'bg-amber-600',
  yellow: 'bg-amber-600',
  danger: 'bg-red-600',
  red: 'bg-red-600',
  rose: 'bg-red-600',
  neutral: 'bg-gray-600',
  slate: 'bg-gray-600',
  gray: 'bg-gray-600',
  violet: 'bg-gray-600',
};

const AdminStatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  badge,
  description,
  color = 'neutral',
  progress,
  progressLabel,
  className,
}) => {
  const progressValue = typeof progress === 'number' ? Math.min(100, Math.max(0, progress)) : null;

  return (
    <StatCard
      title={title}
      value={value}
      icon={Icon}
      type={color}
      subtitle={description}
      trend={trend}
      trendValue={trendValue}
      badge={badge}
      className={className}
    >
      {progressValue !== null ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-500">
            <span>{progressLabel || 'Tiến độ'}</span>
            <span>{progressValue}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                'h-full rounded-full',
                PROGRESS_COLORS[color] || PROGRESS_COLORS.neutral
              )}
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      ) : null}
    </StatCard>
  );
};

AdminStatCard.propTypes = {
  title: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  icon: PropTypes.elementType.isRequired,
  trend: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  trendValue: PropTypes.node,
  badge: PropTypes.node,
  description: PropTypes.node,
  color: PropTypes.string,
  progress: PropTypes.number,
  progressLabel: PropTypes.string,
  className: PropTypes.string,
  delay: PropTypes.number,
};

export default AdminStatCard;
