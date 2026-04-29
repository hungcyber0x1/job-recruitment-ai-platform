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
    <div className={cn('ds-page-header', className)}>
      <div className="ds-page-header-main">
          <div className="flex items-center gap-3 flex-wrap">
            <Text variant="page-title">
              {title}
            </Text>
            {badge && (
              <Text as="span" variant="text-small" className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-4',
                badgeVariant === 'emerald' && 'bg-success/10 text-success-700 border-success/20',
                badgeVariant === 'amber' && 'bg-warning/10 text-warning-700 border-warning/25',
                badgeVariant === 'red' && 'bg-danger/10 text-danger-700 border-danger/20',
                badgeVariant === 'blue' && 'bg-primary/10 text-primary border-primary/20',
                badgeVariant === 'slate' && 'bg-muted text-muted-foreground border-border',
              )}>
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

      {actions && <div className="ds-page-actions">{actions}</div>}
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
