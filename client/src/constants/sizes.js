/**
 * Size configurations for UI components
 */

/**
 * Avatar size classes
 * @readonly
 */
export const AVATAR_SIZES = {
  xs: 'w-6 h-6 text-sm',
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-2xl',
};

/**
 * Button size classes
 * @readonly
 */
export const BUTTON_SIZES = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-sm rounded-2xl',
  lg: 'px-8 py-4 text-base rounded-2xl',
};

/**
 * Icon sizes mapping
 * @readonly
 */
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/**
 * Get icon size number from avatar size string
 * @param {string} avatarSize - Avatar size key (xs, sm, md, lg, xl)
 * @returns {number} Icon size in pixels
 */
export const getIconSizeFromAvatar = (avatarSize) => {
  const mapping = {
    xs: ICON_SIZES.xs,
    sm: ICON_SIZES.sm,
    md: ICON_SIZES.md,
    lg: ICON_SIZES.lg,
    xl: ICON_SIZES.xl,
  };
  return mapping[avatarSize] || ICON_SIZES.md;
};
