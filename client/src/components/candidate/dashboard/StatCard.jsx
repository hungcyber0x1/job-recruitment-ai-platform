import PropTypes from 'prop-types';
import React from 'react';

const StatCard = ({ label, value, icon: Icon, color, subValue, trend = 'up' }) => {
  return (
    <div className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-white/90 p-7 shadow-card backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-premium">
      {/* Soft Hover Glow */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${color}`}
      />

      <div className="relative flex items-center justify-between mb-8">
        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-white shadow-sm transition-all duration-500 ${color.replace('bg-', 'text-')}`}
        >
          <div
            className={`absolute inset-0 opacity-10 blur-md rounded-full transition-all duration-500 group-hover:blur-xl group-hover:opacity-20 ${color}`}
          />
          <Icon size={24} strokeWidth={2} className="relative z-10" />
        </div>

        {subValue && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium tracking-wide shadow-sm transition-all duration-500 ${trend === 'up' ? 'border border-state-success/20 bg-state-success/10 text-state-success' : 'border border-state-danger/20 bg-state-danger/10 text-state-danger'}`}
          >
            {trend === 'up' ? '▲' : '▼'} {subValue}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-txt-muted">{label}</p>
        <h3 className="text-4xl font-semibold tracking-tight text-foreground">{value}</h3>
      </div>
    </div>
  );
};

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
  subValue: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down']),
};

StatCard.defaultProps = {
  subValue: '',
  trend: 'up',
};

export default StatCard;
