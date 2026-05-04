import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { ResponsiveContainer } from 'recharts';

import { cn } from '@/utils';

export const CHART_TICK_STYLE = {
  fill: '#64748b',
  fontSize: 12,
  fontWeight: 600,
};

export const CHART_MUTED_TICK_STYLE = {
  fill: '#94a3b8',
  fontSize: 12,
  fontWeight: 600,
};

export const CHART_TOOLTIP_STYLE = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 600,
};

export const CHART_LEGEND_STYLE = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
  color: '#64748B',
};

/**
 * Vỏ chuẩn cho biểu đồ Recharts (ResponsiveContainer).
 *
 * Vấn đề: Recharts đo kích thước DOM. Nếu ô cha không có width/height thật
 * (flex không có min-w-0, height dạng % không có tổ tiên cố định…), console
 * sẽ báo width/height -1.
 *
 * Cách dùng:
 * - `className` **bắt buộc** gồm chiều cao rõ ràng, ví dụ `h-[220px]`, `h-64`, `h-full`
 *   (khi ô ngoài đã có `h-80` / `min-h-[280px]`).
 * - Thêm `min-h-[200px]` (hoặc tương đương) trong `className` nếu muốn sàn an toàn.
 * - Không bọc `ResponsiveContainer` trong flex `justify-center` mà thiếu `w-full` /
 *   `min-w-0` — dễ làm flex item co width về 0.
 */
export default function ChartSurface({
  className,
  minChartHeight = 200,
  resizeDebounceMs = 50,
  children,
}) {
  const hostRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;

    const updateSize = () => {
      if (!node) return;
      const { width, height } = node.getBoundingClientRect();

      // Recharts needs positive dimensions. we use a small threshold to be safe.
      const measuredHeight = Math.max(height, minChartHeight);
      const isValid = width > 0.5 && measuredHeight > 0.5;
      if (isValid) {
        setDimensions({
          width: Math.floor(width),
          height: Math.floor(measuredHeight),
        });
      }
      setIsReady(isValid);
    };

    updateSize();

    // Small delay to let the browser finish initial layout if needed
    const initialTimer = window.setTimeout(updateSize, 100);

    if (typeof ResizeObserver === 'undefined') {
      return () => window.clearTimeout(initialTimer);
    }

    const observer = new ResizeObserver(() => {
      // Re-measure on resize
      updateSize();
    });
    observer.observe(node);

    return () => {
      window.clearTimeout(initialTimer);
      observer.disconnect();
    };
  }, [minChartHeight, resizeDebounceMs]);

  return (
    <div
      ref={hostRef}
      className={cn('w-full min-w-0 relative flex-1', className)}
      style={{
        minHeight: minChartHeight,
        height: '100%',
        display: 'block',
      }}
    >
      {isReady ? (
        <ResponsiveContainer
          width={dimensions.width}
          height={dimensions.height}
          minWidth={0}
          minHeight={minChartHeight}
          debounce={resizeDebounceMs}
        >
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="w-full opacity-0" style={{ height: minChartHeight }} aria-hidden="true" />
      )}
    </div>
  );
}

ChartSurface.propTypes = {
  className: PropTypes.string,
  minChartHeight: PropTypes.number,
  resizeDebounceMs: PropTypes.number,
  children: PropTypes.node.isRequired,
};
