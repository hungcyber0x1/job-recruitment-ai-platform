import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * Input component with label and error handling
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.className - Additional CSS classes
 */
const Input = React.forwardRef(({ label, error, icon: Icon, className, ...props }, ref) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <label className="text-sm font-semibold leading-6 text-foreground">{label}</label>}
      <div className="relative group/input">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within/input:text-primary">
            {React.isValidElement(Icon) ? (
              React.cloneElement(Icon, {
                size: Icon.props.size || 18,
                className: cn('shrink-0', Icon.props.className),
              })
            ) : (
              <Icon size={18} className="shrink-0" />
            )}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'h-11 w-full rounded-xl border bg-background py-2.5 text-sm text-foreground shadow-sm transition-[color,background-color,border-color,box-shadow] duration-200',
            'placeholder:text-muted-foreground focus:border-primary/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/10',
            Icon ? 'pl-11 pr-4' : 'px-4',
            error
              ? 'border-danger/40 bg-danger/5 focus:border-danger/50 focus-visible:ring-danger/10'
              : 'border-input hover:border-primary/20'
          )}
          {...props}
        />
      </div>
      {error && (
        <span className="mt-0.5 text-xs font-medium text-danger animate-fade-in">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
};

export default Input;
