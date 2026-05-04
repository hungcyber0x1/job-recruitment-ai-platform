import React from 'react';
import { cn } from '@/utils/cn';

export const typographyVariants = {
  'page-title': 'text-3xl font-bold tracking-tight text-foreground',
  'section-title': 'text-2xl font-semibold tracking-tight text-foreground',
  'card-title': 'text-lg font-semibold tracking-tight text-foreground',
  'table-header': 'text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground',
  'text-normal': 'text-sm leading-6 text-muted-foreground',
  'text-secondary': 'text-sm leading-6 text-foreground-soft',
  'text-small': 'text-xs leading-5 text-muted-foreground',
  helper: 'text-xs leading-5 text-muted-foreground',
  'button-text': 'text-sm font-semibold',
};

export function Text({ variant = 'text-normal', as, className, children, ...props }) {
  let Component = as;
  if (!Component) {
    if (variant === 'page-title') Component = 'h1';
    else if (variant === 'section-title') Component = 'h2';
    else if (variant === 'card-title') Component = 'h3';
    else if (variant === 'table-header') Component = 'div';
    else if (variant === 'button-text') Component = 'span';
    else Component = 'p';
  }

  return (
    <Component className={cn(typographyVariants[variant], className)} {...props}>
      {children}
    </Component>
  );
}

export default Text;
