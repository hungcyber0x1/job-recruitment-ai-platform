import PropTypes from 'prop-types';
import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Card component for containing content with various styles
 */
const Card = React.forwardRef(
  ({ children, className, hover = false, variant = 'default', ...props }, ref) => {
    const baseStyles =
      'bg-card rounded-2xl text-card-foreground transition-all duration-300 overflow-hidden';

    const variants = {
      default: 'shadow-card border border-border/80',
      premium:
        'shadow-premium border border-primary/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-500/10',
      glass: 'glass',
      flat: 'bg-muted border-none',
      bordered: 'border-2 border-secondary/20 bg-transparent',
    };

    const hoverEffects = hover ? 'hover-lift' : '';

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverEffects, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);

const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
);

const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-txt-muted', className)} {...props} />
);

const CardContent = ({ className, ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props} />
);

const CardFooter = ({ className, ...props }) => (
  <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
);

CardHeader.propTypes = {
  className: PropTypes.string,
};

CardTitle.propTypes = {
  className: PropTypes.string,
};

CardDescription.propTypes = {
  className: PropTypes.string,
};

CardContent.propTypes = {
  className: PropTypes.string,
};

CardFooter.propTypes = {
  className: PropTypes.string,
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hover: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'premium', 'glass', 'flat', 'bordered']),
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
