/**
 * AdminQuickLinks — Modern Quick Navigation Cards
 * Features:
 * - Glassmorphism styling
 * - Animated hover effects
 * - Icon with colored background
 * - Gradient borders on hover
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/utils';

const AdminQuickLinks = ({ links, className }) => {
  const colorSchemes = {
    emerald: {
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      iconText: 'text-white',
      hoverBorder: 'hover:border-emerald-200/50',
      hoverBg: 'hover:bg-emerald-50/50',
      hoverIconBg: 'group-hover/icon:bg-emerald-500',
    },
    blue: {
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconText: 'text-white',
      hoverBorder: 'hover:border-blue-200/50',
      hoverBg: 'hover:bg-blue-50/50',
      hoverIconBg: 'group-hover/icon:bg-blue-500',
    },
    amber: {
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
      iconText: 'text-white',
      hoverBorder: 'hover:border-amber-200/50',
      hoverBg: 'hover:bg-amber-50/50',
      hoverIconBg: 'group-hover/icon:bg-amber-500',
    },
    violet: {
      iconBg: 'bg-gradient-to-br from-violet-500 to-violet-600',
      iconText: 'text-white',
      hoverBorder: 'hover:border-violet-200/50',
      hoverBg: 'hover:bg-violet-50/50',
      hoverIconBg: 'group-hover/icon:bg-violet-500',
    },
    red: {
      iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
      iconText: 'text-white',
      hoverBorder: 'hover:border-red-200/50',
      hoverBg: 'hover:bg-red-50/50',
      hoverIconBg: 'group-hover/icon:bg-red-500',
    },
    rose: {
      iconBg: 'bg-gradient-to-br from-rose-500 to-rose-600',
      iconText: 'text-white',
      hoverBorder: 'hover:border-rose-200/50',
      hoverBg: 'hover:bg-rose-50/50',
      hoverIconBg: 'group-hover/icon:bg-rose-500',
    },
    cyan: {
      iconBg: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      iconText: 'text-white',
      hoverBorder: 'hover:border-cyan-200/50',
      hoverBg: 'hover:bg-cyan-50/50',
      hoverIconBg: 'group-hover/icon:bg-cyan-500',
    },
    slate: {
      iconBg: 'bg-gradient-to-br from-slate-500 to-slate-600',
      iconText: 'text-white',
      hoverBorder: 'hover:border-slate-200/50',
      hoverBg: 'hover:bg-slate-50/50',
      hoverIconBg: 'group-hover/icon:bg-slate-500',
    },
  };

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {links.map((link, index) => {
        const scheme = colorSchemes[link.color] || colorSchemes.emerald;
        const Icon = link.icon;

        return (
          <Link
            key={link.to || index}
            to={link.to || '#'}
            onClick={link.onClick}
            className={cn(
              'group relative flex items-start gap-4 rounded-2xl border border-border/50 bg-card p-5',
              'shadow-sm transition-all duration-300 ease-out',
              'hover:shadow-lg hover:-translate-y-1',
              scheme.hoverBorder,
              scheme.hoverBg,
              'animate-in fade-in slide-in-from-bottom-4'
            )}
            style={{ animationDelay: `${index * 50}ms`, animationDuration: '400ms' }}
          >
            {/* Background gradient on hover */}
            <div
              className={cn(
                'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                'bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent'
              )}
            />

            {/* Icon */}
            <div
              className={cn(
                'group/icon relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg',
                'transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
                scheme.iconBg
              )}
            >
              <Icon className={cn('h-5 w-5', scheme.iconText)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground leading-tight">{link.label}</p>
                <ArrowRight
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300',
                    'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                  )}
                />
              </div>
              {link.description && (
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {link.description}
                </p>
              )}
              {link.badge && (
                <span className="mt-2 inline-flex items-center rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
                  {link.badge}
                </span>
              )}
            </div>

            {/* Decorative corner gradient */}
            <div
              className={cn(
                'absolute -right-6 -bottom-6 h-24 w-24 rounded-full opacity-0 group-hover:opacity-5',
                'transition-opacity duration-500 blur-3xl',
                scheme.iconBg.replace('bg-gradient-to-br', 'bg')
              )}
            />
          </Link>
        );
      })}
    </div>
  );
};

AdminQuickLinks.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.elementType.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      to: PropTypes.string,
      onClick: PropTypes.func,
      color: PropTypes.oneOf([
        'emerald',
        'blue',
        'amber',
        'violet',
        'red',
        'rose',
        'cyan',
        'slate',
      ]),
      badge: PropTypes.string,
    })
  ).isRequired,
  className: PropTypes.string,
};

export default AdminQuickLinks;
