import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * Generic Skeleton loading placeholder
 */
const Skeleton = ({ className, ...props }) => {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/60', className)} {...props} />;
};

Skeleton.propTypes = {
  className: PropTypes.string,
};

export default Skeleton;
