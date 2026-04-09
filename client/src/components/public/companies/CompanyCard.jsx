import PropTypes from 'prop-types';
import React from 'react';
import { MapPin, Users, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/utils';

function avatarPalette(name) {
  const s = String(name || 'x');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i);
  const idx = Math.abs(h) % 3;
  const palettes = [
    'bg-slate-900 text-white',
    'bg-emerald-100 text-emerald-900',
    'bg-slate-100 text-slate-800',
  ];
  return palettes[idx];
}

const CompanyCard = ({ company }) => {
  const initials =
    company.name
      ?.split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CO';

  const hasLogo = Boolean(company.logo?.trim());

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card',
        'shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)]',
        'transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-primary/25',
        'hover:shadow-[0_16px_48px_-12px_rgba(16,185,129,0.12)]',
        'dark:border-slate-700/60 dark:hover:border-primary/35'
      )}
    >
      <div className="flex flex-1 flex-col px-5 pb-5 pt-6 sm:px-6">
        <div className="flex gap-4">
          <Avatar
            className={cn(
              'size-[3.75rem] shrink-0 rounded-xl ring-1 ring-black/[0.06] dark:ring-white/10',
              'transition-transform duration-300 group-hover:scale-[1.02]'
            )}
          >
            {hasLogo ? (
              <AvatarImage src={company.logo} alt={company.name} className="object-cover" />
            ) : null}
            <AvatarFallback
              className={cn('rounded-xl text-base font-bold', avatarPalette(company.name))}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
              {company.name}
            </h3>
            <p className="mt-2 inline-flex max-w-full rounded-full border border-primary/12 bg-primary/[0.07] px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-primary">
              <span className="truncate">{company.industry}</span>
            </p>
          </div>
        </div>

        <ul className="mt-6 flex flex-col gap-2.5 text-base">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden />
            </span>
            <span className="min-w-0 pt-1 font-medium leading-snug text-muted-foreground">
              {company.location}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
              <Users className="size-3.5" aria-hidden />
            </span>
            <span className="pt-1 font-medium text-muted-foreground">{company.size} nhân viên</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="size-3.5" aria-hidden />
            </span>
            <span className="pt-1 font-bold text-primary">
              {company.openPositions} việc đang tuyển
            </span>
          </li>
        </ul>
      </div>

      <div className="border-t border-border/50 px-5 py-4 sm:px-6">
        <Button
          className="h-11 w-full gap-2 rounded-xl text-base font-bold shadow-sm transition-all duration-300 hover:gap-2.5"
          asChild
        >
          <Link to={`/companies/${company.id}`}>
            Xem chi tiết
            <ArrowRight className="size-4 opacity-80" aria-hidden />
          </Link>
        </Button>
      </div>
    </article>
  );
};

CompanyCard.propTypes = {
  company: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    logo: PropTypes.string,
    name: PropTypes.string,
    industry: PropTypes.string,
    industryKey: PropTypes.string,
    location: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    openPositions: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};

export default CompanyCard;
