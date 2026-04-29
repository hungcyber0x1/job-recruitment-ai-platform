/**
 * Variant configurations for UI components
 */

/**
 * Badge color variants (mapped to semantic tailwind tokens)
 * @readonly
 */
export const BADGE_VARIANTS = {
  default: 'bg-muted text-muted-foreground border border-border',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  secondary: 'bg-muted text-muted-foreground border border-border',
  neutral: 'bg-muted text-muted-foreground border border-border',
  inactive: 'bg-muted text-muted-foreground border border-border',
  success: 'bg-success/10 text-success-700 border border-success/20',
  green: 'bg-success/10 text-success-700 border border-success/20',
  warning: 'bg-warning/10 text-warning-700 border border-warning/25',
  pending: 'bg-warning/10 text-warning-700 border border-warning/25',
  yellow: 'bg-warning/10 text-warning-700 border border-warning/25',
  error: 'bg-danger/10 text-danger-700 border border-danger/20',
  danger: 'bg-danger/10 text-danger-700 border border-danger/20',
  destructive: 'bg-danger/10 text-danger-700 border border-danger/20',
  rejected: 'bg-danger/10 text-danger-700 border border-danger/20',
  info: 'bg-primary/10 text-primary border border-primary/20',
  indigo: 'bg-primary/10 text-primary border border-primary/20',
  outline: 'bg-card text-foreground border border-border',
  glass: 'bg-card/80 text-foreground border border-border',
};
