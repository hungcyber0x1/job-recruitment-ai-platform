import PropTypes from 'prop-types';
import { ResponsiveContainer } from 'recharts';

import { cn } from '@/utils';

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
  return (
    <div className={cn('w-full min-w-0', className)}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={minChartHeight}
        debounce={resizeDebounceMs}
      >
        {children}
      </ResponsiveContainer>
    </div>
  );
}

ChartSurface.propTypes = {
  className: PropTypes.string,
  minChartHeight: PropTypes.number,
  resizeDebounceMs: PropTypes.number,
  children: PropTypes.node.isRequired,
};
