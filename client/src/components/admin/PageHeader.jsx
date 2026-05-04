import PropTypes from 'prop-types';
import React from 'react';

import { cn } from '@/utils';

const PageHeader = ({
  icon: Icon,
  eyebrow,
  badge,
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}) => {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-emerald-100/70 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_82%)] p-6 shadow-sm transition-all lg:p-8',
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

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          {(eyebrow || badge) && (
            <div className="flex flex-wrap items-center gap-2">
              {eyebrow && (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/85 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700 shadow-sm">
                  {Icon ? <Icon size={14} /> : null}
                  {eyebrow}
                </div>
              )}
              {badge && (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 shadow-sm">
                  {badge}
                </div>
              )}
            </div>
          )}
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
      </div>

      {children ? <div className={cn('relative z-10 mt-6', bodyClassName)}>{children}</div> : null}
    </section>
  );
};

PageHeader.propTypes = {
  icon: PropTypes.elementType,
  eyebrow: PropTypes.string,
  badge: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
};

export default PageHeader;
