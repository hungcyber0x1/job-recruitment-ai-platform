import PropTypes from 'prop-types';
import React from 'react';
import { MapPin, Users, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/common/Card';
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
    <Card
      hover
      className={cn(
        'card-premium-hover group relative flex h-full flex-col overflow-hidden border-border/40 bg-card transition-all duration-300'
      )}
    >
      {/* Decorative Banner Background */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Main Content */}
      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-12 sm:px-6">
        {/* Logo & Header Info */}
        <div className="flex flex-col items-center text-center">
          <Avatar
            className={cn(
              'size-20 shrink-0 rounded-2xl border-4 border-white shadow-xl ring-1 ring-black/[0.03] dark:border-slate-900',
              'transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary/10'
            )}
          >
            {hasLogo ? (
              <AvatarImage src={company.logo} alt={company.name} className="object-cover" />
            ) : null}
            <AvatarFallback
              className={cn('rounded-2xl text-xl font-bold', avatarPalette(company.name))}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="mt-4 min-w-0">
            <h3 className="line-clamp-2 text-xl font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary leading-tight">
              {company.name}
            </h3>
            <div className="mt-2.5 flex justify-center">
              <span className="inline-flex items-center rounded-lg bg-primary/8 px-2.5 py-1 text-sm font-bold uppercase tracking-widest text-primary border border-primary/10">
                {company.industry}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Integrated Dashboard Look */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center rounded-xl bg-slate-50/80 p-3 text-center transition-colors group-hover:bg-white group-hover:ring-1 group-hover:ring-primary/10 dark:bg-slate-900/40">
            <MapPin className="mb-1.5 size-4 text-primary/60" />
            <span className="text-sm font-semibold text-foreground/80 leading-tight line-clamp-1">
              {company.location?.split(',')[0]}
            </span>
            <span className="text-sm font-medium text-muted-foreground">Địa điểm</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-slate-50/80 p-3 text-center transition-colors group-hover:bg-white group-hover:ring-1 group-hover:ring-primary/10 dark:bg-slate-900/40">
            <Users className="mb-1.5 size-4 text-primary/60" />
            <span className="text-sm font-semibold text-foreground/80 leading-tight">
              {company.size}
            </span>
            <span className="text-sm font-medium text-muted-foreground">Quy mô</span>
          </div>
        </div>

        {/* Positions Highlight */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/20 bg-primary/[0.02] p-3 transition-colors group-hover:bg-primary/[0.04]">
          <Briefcase className="size-4 text-primary" />
          <span className="text-[14px] font-bold text-primary">
            {company.openPositions} vị trí đang tuyển
          </span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-auto border-t border-border/40 bg-slate-50/30 px-5 py-4 dark:bg-white/5 sm:px-6">
        <Link
          to={`/companies/${company.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-foreground shadow-sm ring-1 ring-black/[0.05] transition-all hover:bg-primary hover:text-white hover:ring-primary hover:shadow-primary/20 active:scale-[0.98]"
        >
          Chi tiết doanh nghiệp
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Card>
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
