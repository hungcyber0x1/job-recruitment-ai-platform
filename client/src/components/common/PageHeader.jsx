import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/utils';

const PageHeader = ({
  title,
  rootLabel,
  rootPath,
  actions,
  className,
  showBack = true,
  backPath,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn('ds-page-header', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="role-topbar-icon border border-border bg-card shadow-sm"
            aria-label="Quay lại"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <h1 className="truncate text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      </div>

      {actions && <div className="ds-page-actions">{actions}</div>}
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  rootLabel: PropTypes.string,
  rootPath: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
  showBack: PropTypes.bool,
  backPath: PropTypes.string,
};

export default PageHeader;
