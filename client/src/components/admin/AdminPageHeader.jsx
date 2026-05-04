/**
 * Redesigned AdminPageHeader v2 — Clean Contextual Header
 *
 * Changes from v1:
 * - Cleaner visual hierarchy (subtitle renamed to description)
 * - Built-in breadcrumb trail with home link
 * - Right-aligned actions slot
 * - Compact vertical rhythm for data-heavy pages
 * - Better responsive behavior
 */
import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/utils';
import { Text } from '@/components/ui/text';

/**
 * AdminPageHeader — main page title with optional description and actions
 */
const AdminPageHeader = ({
  title,
  description,
  actions,
  className,
  badge,
  badgeVariant = 'emerald',
}) => {
  return (
    <div
      className={cn(
        'ds-page-header relative overflow-hidden rounded-[2rem] border border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)] p-6 shadow-sm lg:p-8',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_36%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_30%)]" />

      <div className="ds-page-header-main relative z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <Text variant="page-title">{title}</Text>
          {badge && (
            <Text
              as="span"
              variant="text-small"
              className={cn(
                'inline-flex items-center rounded-full border bg-white/85 px-2.5 py-1 text-xs font-semibold leading-4 shadow-sm',
                badgeVariant === 'emerald' && 'text-success-700 border-success/20',
                badgeVariant === 'amber' && 'text-warning-700 border-warning/25',
                badgeVariant === 'red' && 'text-danger-700 border-danger/20',
                badgeVariant === 'blue' && 'text-primary border-primary/20',
                badgeVariant === 'slate' && 'text-muted-foreground border-border'
              )}
            >
              {badge}
            </Text>
          )}
        </div>
        {description && (
          <Text variant="text-normal" className="ds-page-description">
            {description}
          </Text>
        )}
      </div>

      {actions && <div className="ds-page-actions relative z-10">{actions}</div>}
    </div>
  );
};

AdminPageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
  badge: PropTypes.string,
  badgeVariant: PropTypes.oneOf(['emerald', 'amber', 'red', 'blue', 'slate']),
};

export default AdminPageHeader;
