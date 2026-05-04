import React from 'react';
import PropTypes from 'prop-types';
import { Briefcase } from 'lucide-react';

import StatCard, { getStatCardType } from '@/components/common/StatCard';
import { cn } from '../../utils/cn';

export const EMPLOYER_STAT_CARD_TONES = {
  emerald: 'success',
  green: 'success',
  success: 'success',
  blue: 'primary',
  sky: 'primary',
  cyan: 'primary',
  primary: 'primary',
  amber: 'warning',
  yellow: 'warning',
  warning: 'warning',
  rose: 'danger',
  red: 'danger',
  danger: 'danger',
  slate: 'neutral',
  gray: 'neutral',
  violet: 'neutral',
  neutral: 'neutral',
};

export const getEmployerStatTone = (tone) =>
  getStatCardType(EMPLOYER_STAT_CARD_TONES[tone] || tone);

function EmployerStatCard({
  icon: Icon,
  label,
  value,
  helper,
  sublabel,
  tone,
  color,
  active = false,
  loading = false,
  onClick,
  to,
  className,
}) {
  const MetricIcon = Icon || Briefcase;
  const helperText = helper ?? sublabel;

  return (
    <StatCard
      title={label}
      value={value}
      subtitle={helperText}
      icon={MetricIcon}
      type={getEmployerStatTone(tone || color || 'neutral')}
      active={active}
      loading={loading}
      onClick={onClick}
      to={to}
      className={cn('h-full', className)}
    />
  );
}

EmployerStatCard.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.node.isRequired,
  value: PropTypes.node,
  helper: PropTypes.node,
  sublabel: PropTypes.node,
  tone: PropTypes.string,
  color: PropTypes.string,
  active: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  to: PropTypes.string,
  className: PropTypes.string,
};

export default EmployerStatCard;
