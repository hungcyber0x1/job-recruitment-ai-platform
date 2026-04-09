import { cn } from '@/utils';

/** Độ dày nét mặc định — đồng bộ giao diện HireAI (UI list, nav, card) */
export const LUCIDE_STROKE_WIDTH = 1.5;

/**
 * Kích thước token → pixel (dùng với Lucide `size` prop)
 * @type {Record<'xs'|'sm'|'md'|'lg'|'xl', number>}
 */
export const lucideSizePx = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/**
 * @param {number | keyof typeof lucideSizePx} size
 * @returns {number}
 */
export function resolveLucideSize(size) {
  if (typeof size === 'number' && !Number.isNaN(size)) return size;
  if (typeof size === 'string' && size in lucideSizePx) return lucideSizePx[size];
  return lucideSizePx.md;
}

/**
 * Props chuẩn để spread lên mọi component từ `lucide-react`.
 *
 * @param {object} opts
 * @param {number | keyof typeof lucideSizePx} [opts.size='md']
 * @param {string} [opts.className]
 * @param {boolean} [opts.decorative=true] — `aria-hidden` khi không cần đọc tên icon
 * @param {number} [opts.strokeWidth=LUCIDE_STROKE_WIDTH]
 */
export function lucideIconProps({
  size = 'md',
  className,
  decorative = true,
  strokeWidth = LUCIDE_STROKE_WIDTH,
} = {}) {
  return {
    size: resolveLucideSize(size),
    strokeWidth,
    className: cn('shrink-0', className),
    ...(decorative ? { 'aria-hidden': true } : {}),
  };
}
