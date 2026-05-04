import PropTypes from 'prop-types';
import React from 'react';

import BaseStatCard from '@/components/common/StatCard';

const StatCard = ({ label, value, icon: Icon, color, subValue, trend = 'up' }) => (
  <BaseStatCard
    title={label}
    value={value}
    icon={Icon}
    type={color}
    trendValue={subValue ? `${trend === 'up' ? '▲' : '▼'} ${subValue}` : undefined}
  />
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string,
  subValue: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down']),
};

StatCard.defaultProps = {
  color: 'neutral',
  subValue: '',
  trend: 'up',
};

export default StatCard;
