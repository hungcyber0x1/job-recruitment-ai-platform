import PropTypes from 'prop-types';
import React from 'react';

import { cn } from '@/utils';

const ContentCard = ({
  as: Component = 'section',
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
  headerClassName,
  contentClassName,
  padded = true,
  hover = true,
  ...props
}) => {
  const hasHeader = title || description || action || Icon;

  return (
    <Component
      className={cn(
        'rounded-[2rem] border border-slate-200 bg-white shadow-sm',
        padded && 'p-5 sm:p-6',
        hover && 'transition-all hover:border-emerald-200/70 hover:shadow-md',
        className
      )}
      {...props}
    >
      {hasHeader ? (
        <div className={cn('flex flex-wrap items-start justify-between gap-4', headerClassName)}>
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                <Icon className="h-4 w-4" />
              </div>
            ) : null}
            <div className="min-w-0">
              {title ? (
                <h2 className="text-base font-bold tracking-tight text-slate-950">{title}</h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
              ) : null}
            </div>
          </div>
          {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
        </div>
      ) : null}

      <div className={cn(hasHeader && 'mt-6', contentClassName)}>{children}</div>
    </Component>
  );
};

ContentCard.propTypes = {
  as: PropTypes.elementType,
  icon: PropTypes.elementType,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  contentClassName: PropTypes.string,
  padded: PropTypes.bool,
  hover: PropTypes.bool,
};

export default ContentCard;
