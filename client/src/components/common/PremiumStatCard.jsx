import React from 'react';
import PropTypes from 'prop-types';

import StatCard from './StatCard';

const PremiumStatCard = ({
  title,
  value,
  icon: Icon,
  variant = 'neutral',
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
    type={color || variant}
    trend={trend}
    trendLabel={trendLabel}
    badge={badge}
    subtitle={description}
    className={className}
    onClick={onClick}
  />
);

PremiumStatCard.propTypes = {
  title: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  icon: PropTypes.elementType.isRequired,
  variant: PropTypes.string,
  color: PropTypes.string,
  trend: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  trendLabel: PropTypes.node,
  badge: PropTypes.node,
  description: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default PremiumStatCard;
