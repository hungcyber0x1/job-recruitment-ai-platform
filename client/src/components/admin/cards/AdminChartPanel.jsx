/**
 * AdminChartPanel — Enhanced Chart Container with Modern Design
 * Features:
 * - Glassmorphism styling
 * - Built-in header with title and actions
 * - Loading and empty states
 * - Responsive layout
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/utils';
import Skeleton from '@/components/common/Skeleton';

const AdminChartPanel = ({
  title,
  subtitle,
  action,
  actionLabel,
  actionTo,
  children,
  className,
  loading = false,
  chartClassName,
  noPadding = false,
}) => {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm',
        'transition-all duration-300',
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header */}
      {(title || action) && (
        <div className="relative flex flex-wrap items-start gap-3 border-b border-border/50 px-6 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {actionLabel && (
            actionTo ? (
              <Link
                to={actionTo}
                className="ml-auto inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-primary transition-colors hover:text-primary/80"
              >
                {actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <button
                onClick={action}
                className="ml-auto inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-primary transition-colors hover:text-primary/80"
              >
                {actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )
          )}
        </div>
      )}

      {/* Content */}
      <div className={cn('relative', noPadding ? '' : 'p-6')}>
        {loading ? (
          <div className={cn('flex flex-col gap-4', !noPadding && 'p-6')}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <div className="flex justify-between">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-3 w-16" />
              ))}
            </div>
          </div>
        ) : (
          <div className={cn(chartClassName)}>
            {children}
          </div>
        )}
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

AdminChartPanel.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  action: PropTypes.func,
  actionLabel: PropTypes.string,
  actionTo: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  loading: PropTypes.bool,
  chartClassName: PropTypes.string,
  noPadding: PropTypes.bool,
};

export default AdminChartPanel;
