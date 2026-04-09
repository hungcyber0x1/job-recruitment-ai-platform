import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/index';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-base font-black uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-[1px] active:translate-x-[1px] active:shadow-none',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-accent-foreground hover:bg-accent/90 shadow-solid border border-accent',
        destructive: 'bg-error text-white hover:bg-error/90 shadow-solid border border-error',
        outline:
          'border border-border bg-card text-card-foreground hover:bg-muted hover:border-accent hover:text-accent-foreground shadow-solid-sm',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-secondary shadow-solid-sm',
        ghost:
          'text-foreground hover:bg-muted hover:text-accent-foreground border border-transparent',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/90',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4',
        lg: 'h-14 px-10 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
