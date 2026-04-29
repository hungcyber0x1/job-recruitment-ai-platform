import * as React from 'react';

import { cn } from '@/utils/index';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[112px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground ring-offset-background shadow-sm transition-[color,background-color,border-color,box-shadow] duration-200 placeholder:text-muted-foreground hover:border-primary/20 focus-visible:border-primary/35 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
