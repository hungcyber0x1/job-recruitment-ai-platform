import PropTypes from 'prop-types';
import { BADGE_VARIANTS } from '@/constants';
import { cn } from '../../utils/cn';

/**
 * Badge component for displaying labels and tags
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.variant - Color variant (default, primary, success, warning, error, info)
 * @param {React.ReactNode} props.icon - Optional icon element
 * @param {string} props.className - Additional CSS classes
 */
const Badge = ({ children, variant = 'default', icon, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-transform duration-200',
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.default,
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'error', 'warning', 'info']),
  icon: PropTypes.node,
  className: PropTypes.string,
};

export default Badge;
