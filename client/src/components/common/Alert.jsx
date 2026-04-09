import PropTypes from 'prop-types';
import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const alertVariants = cva(
  'p-4 rounded-xl border flex items-start gap-3 animate-fade-in slide-in-from-top-2',
  {
    variants: {
      type: {
        info: 'bg-info-50 text-info-800 border-info-200',
        success: 'bg-success-50 text-success-800 border-success-200',
        warning: 'bg-warning-50 text-warning-800 border-warning-200',
        error: 'bg-error-50 text-error-800 border-error-200',
      },
    },
    defaultVariants: {
      type: 'info',
    },
  }
);

const iconMap = {
  info: <Info size={20} className="text-info-500" />,
  success: <CheckCircle size={20} className="text-success-500" />,
  warning: <AlertCircle size={20} className="text-warning-500" />,
  error: <XCircle size={20} className="text-error-500" />,
};

const Alert = ({ type = 'info', message, onClose, className }) => {
  return (
    <div className={cn(alertVariants({ type }), className)}>
      <div className="mt-0.5 shrink-0">{iconMap[type]}</div>
      <div className="flex-grow text-sm font-medium">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-black/5 rounded-md transition-colors focus-ring"
          aria-label="Close alert"
        >
          <X size={16} className="text-current opacity-70 hover:opacity-100" />
        </button>
      )}
    </div>
  );
};

Alert.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  message: PropTypes.node.isRequired,
  onClose: PropTypes.func,
  className: PropTypes.string,
};

Alert.defaultProps = {
  type: 'info',
  onClose: undefined,
  className: '',
};

export default Alert;
