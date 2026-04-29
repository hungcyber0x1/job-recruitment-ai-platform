import React from 'react';
import PropTypes from 'prop-types';
import StatCard from './StatCard';

const PremiumStatCard = ({
  title,
  value,
  icon: Icon,
  variant = 'emerald',
  color,
  trend,
  trendLabel,
  badge,
  description,
  className,
  onClick,
}) => (
  <StatCard
    title={title}
    value={value}
    icon={Icon}
    variant={color || variant}
    trend={trend}
    trendLabel={trendLabel}
    badge={badge}
    description={description}
    className={className}
    onClick={onClick}
  />
);

PremiumStatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  variant: PropTypes.string,
  color: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
  trendLabel: PropTypes.string,
  badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  description: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default PremiumStatCard;
