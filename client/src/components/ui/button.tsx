import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/index';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/92',
        primary:
          'border border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/92',
        destructive: 'border border-danger bg-danger text-white shadow-sm hover:bg-danger/92',
        danger: 'border border-danger bg-danger text-white shadow-sm hover:bg-danger/92',
        outline:
          'border border-border bg-card text-foreground shadow-sm hover:border-primary/20 hover:bg-muted/60 hover:text-foreground',
        secondary:
          'border border-border bg-card text-foreground shadow-sm hover:border-primary/20 hover:bg-muted/60 hover:text-foreground',
        ghost:
          'border border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3.5 text-sm',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10 p-0',
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
