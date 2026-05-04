import PropTypes from 'prop-types';
import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Card component for containing content with various styles
 */
const Card = React.forwardRef(
  ({ children, className, hover = false, variant = 'default', ...props }, ref) => {
    const baseStyles = 'ds-surface-card p-5';

    const variants = {
      default: '',
      premium: 'border-primary/10 shadow-sm shadow-primary/5',
      glass: 'glass-premium',
      flat: 'border-transparent bg-muted/50 shadow-none',
      bordered: 'border-border bg-card',
    };

    const hoverEffects = hover
      ? 'hover:-translate-y-px hover:border-primary/20 hover:shadow-md'
      : '';

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
  <div className={cn('mb-4 flex flex-col gap-1.5', className)} {...props} />
);

const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-foreground', className)} {...props} />
);

const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />
);

const CardContent = ({ className, ...props }) => (
  <div className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />
);

const CardFooter = ({ className, ...props }) => (
  <div className={cn('mt-4 flex items-center gap-3', className)} {...props} />
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
