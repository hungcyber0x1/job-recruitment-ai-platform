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
const Input = React.forwardRef(({ label, error, className, ...props }, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-sm font-semibold text-txt-main ml-1">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border bg-background transition-all',
          'placeholder:text-txt-light text-txt-main font-medium',
          'focus:outline-none focus:border-primary-500 focus-visible:ring-2',
          error
            ? 'border-error-400 bg-error-50/30 focus:border-error-500 focus-visible:ring-error-500/20'
            : 'border-secondary-200 focus:border-primary-500 focus-visible:ring-primary-500/20 hover:border-secondary-300'
        )}
        {...props}
      />
      {error && (
        <span className="text-sm font-medium text-error-600 ml-1 mt-0.5 animate-fade-in">
          {error}
        </span>
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
