/**
 * CandidatePageHeader — Compact Page Header (no breadcrumb)
 *
 * Breadcrumb is already shown in the layout header.
 * This component only renders: title (h1), optional description, and actions.
 *
 * Usage:
 * <CandidatePageHeader
 *   title="Hồ sơ cá nhân"
 *   description="Quản lý thông tin nghề nghiệp"
 *   actions={<Button>Action</Button>}
 * />
 */
import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/utils';

const CandidatePageHeader = ({
  title,
  icon: Icon,
  description,
  actions,
  className,
}) => {
  return (
    <div className={cn('ds-page-header', className)}>
      <div className="ds-page-header-main">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground">
          {Icon && (
            <span className="ds-page-icon">
              <Icon size={18} strokeWidth={2.25} />
            </span>
          )}
          {title}
        </h1>

      {description && (
        <p className="ds-page-description">
          {description}
        </p>
      )}

      </div>

      {actions && <div className="ds-page-actions">{actions}</div>}
    </div>
  );
};

CandidatePageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  description: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
};

export default CandidatePageHeader;
