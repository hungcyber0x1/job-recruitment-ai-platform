/**
 * AdminKPIGrid — Key Performance Indicator Grid
 * Features:
 * - Responsive grid layout
 * - Animated entrance
 * - Multiple color schemes
 * - Progress indicators
 */
import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/utils';
import AdminStatCard from './AdminStatCard';

const AdminKPIGrid = ({ cards, columns = 4, className }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns] || gridCols[4], className)}>
      {cards.map((card, index) => (
        <AdminStatCard
          key={card.key || index}
          {...card}
          delay={index * 100}
        />
      ))}
    </div>
  );
};

AdminKPIGrid.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
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
    })
  ).isRequired,
  columns: PropTypes.oneOf([1, 2, 3, 4]),
  className: PropTypes.string,
};

export default AdminKPIGrid;
