/**
 * Variant configurations for UI components
 */

/**
 * Badge color variants (mapped to semantic tailwind tokens)
 * @readonly
 */
export const BADGE_VARIANTS = {
  default: 'bg-secondary text-secondary-foreground border border-secondaryShadow',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  error: 'bg-error/10 text-error border border-error/20',
  destructive: 'bg-error/10 text-error border border-error/20',
  info: 'bg-primary-500/10 text-primary-600 border border-primary-500/20',
  outline: 'bg-transparent border-2 border-primary text-primary',
  glass: 'glass text-primary px-3 py-1.5',
};
