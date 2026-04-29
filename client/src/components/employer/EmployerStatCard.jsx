import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

import { cn } from '../../utils/cn';

export const EMPLOYER_STAT_CARD_TONES = {
  emerald: {
    accent: 'bg-emerald-500/12',
    line: 'from-emerald-400/80 via-emerald-300/25 to-transparent',
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
  blue: {
    accent: 'bg-sky-500/12',
    line: 'from-sky-400/80 via-sky-300/25 to-transparent',
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
  },
  sky: {
    accent: 'bg-sky-500/12',
    line: 'from-sky-400/80 via-sky-300/25 to-transparent',
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
  },
  amber: {
    accent: 'bg-amber-500/12',
    line: 'from-amber-400/80 via-amber-300/25 to-transparent',
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
  },
  violet: {
    accent: 'bg-violet-500/12',
    line: 'from-violet-400/80 via-violet-300/25 to-transparent',
    icon: 'bg-violet-50 text-violet-700 ring-violet-100',
  },
  rose: {
    accent: 'bg-rose-500/12',
    line: 'from-rose-400/80 via-rose-300/25 to-transparent',
    icon: 'bg-rose-50 text-rose-700 ring-rose-100',
  },
  slate: {
    accent: 'bg-slate-400/12',
    line: 'from-slate-400/70 via-slate-300/25 to-transparent',
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
  },
};

export const getEmployerStatTone = (tone) =>
  EMPLOYER_STAT_CARD_TONES[tone] || EMPLOYER_STAT_CARD_TONES.slate;

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
  const styles = getEmployerStatTone(tone || color || 'slate');
  const helperText = helper ?? sublabel;
  const interactive = Boolean(onClick || to);

  const content = (
    <>
      <div className={cn('absolute -right-5 -top-5 h-14 w-14 rounded-full blur-3xl opacity-70', styles.accent)} />
      <div className={cn('absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-80', styles.line)} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-2 text-[1.55rem] font-bold tracking-tight text-slate-950 tabular-nums">
              {value}
            </p>
          )}
          {helperText ? <p className="mt-1.5 text-xs leading-5 text-slate-500">{helperText}</p> : null}
        </div>

        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset shadow-sm transition-transform duration-200 group-hover:scale-105',
            styles.icon
          )}
        >
          <MetricIcon className="h-4 w-4" />
        </div>
      </div>
    </>
  );

  const rootClassName = cn(
    'group relative h-full overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200/80 hover:shadow-md',
    active ? 'border-emerald-300/80 bg-emerald-50/40 shadow-emerald-100/50' : 'border-slate-200/80',
    interactive && 'cursor-pointer',
    className
  );

  if (to) {
    return (
      <Link to={to} className={cn('block', rootClassName)}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn('w-full', rootClassName)}>
        {content}
      </button>
    );
  }

  return <div className={rootClassName}>{content}</div>;
}

export default EmployerStatCard;
