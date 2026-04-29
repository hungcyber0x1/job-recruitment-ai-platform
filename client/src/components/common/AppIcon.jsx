import PropTypes from 'prop-types';
import React from 'react';
import { lucideIconProps } from '@/lib/lucideIcon';

/**
 * Icon Lucide thống nhất: stroke 1.5, kích thước token, `shrink-0`.
 * Dùng `<AppIcon icon={Search} size="sm" />` thay vì lặp `size` + `strokeWidth` rải rác.
 */
const AppIcon = ({
  icon: Icon,
  size = 'md',
  className,
  decorative = true,
  strokeWidth,
  ...rest
}) => {
  if (!Icon) return null;
  return React.createElement(Icon, {
    ...lucideIconProps({ size, className, decorative, strokeWidth }),
    ...rest,
  });
};

AppIcon.propTypes = {
  icon: PropTypes.elementType.isRequired,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl'])]),
  className: PropTypes.string,
  decorative: PropTypes.bool,
  strokeWidth: PropTypes.number,
};

export default AppIcon;
