import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/index';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground border-border',
        primary: 'bg-primary/10 text-primary border-primary/20',
        secondary:
          'bg-muted text-muted-foreground border-border',
        destructive:
          'bg-danger/10 text-danger-700 border-danger/20',
        danger: 'bg-danger/10 text-danger-700 border-danger/20',
        error: 'bg-danger/10 text-danger-700 border-danger/20',
        rejected: 'bg-danger/10 text-danger-700 border-danger/20',
        outline: 'bg-card text-foreground border-border',
        emerald: 'bg-success/10 text-success-700 border-success/20',
        success: 'bg-success/10 text-success-700 border-success/20',
        green: 'bg-success/10 text-success-700 border-success/20',
        warning: 'bg-warning/10 text-warning-700 border-warning/25',
        pending: 'bg-warning/10 text-warning-700 border-warning/25',
        yellow: 'bg-warning/10 text-warning-700 border-warning/25',
        inactive: 'bg-muted text-muted-foreground border-border',
        neutral: 'bg-muted text-muted-foreground border-border',
        indigo: 'bg-primary/10 text-primary border-primary/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
