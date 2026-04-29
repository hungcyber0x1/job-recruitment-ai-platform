/**
 * Redesigned AdminTable v3 — Enterprise Data Grid with Modern Design
 *
 * Changes from v2:
 * - Enhanced glassmorphism styling
 * - Improved animations and transitions
 * - Better hover states and visual feedback
 * - Enhanced bulk actions bar
 * - Modern pagination design
 * - Better empty states
 * - Column resize indicators
 */
import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, CheckSquare, Square, X, Search, ArrowUpDown } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * AdminTable — Enterprise-grade data table component
 *
 * @param {Object[]} columns - Column definitions
 * @param {string} columns[].key - Unique column key
 * @param {string|React.Component} columns[].header - Column header label or component
 * @param {Function} columns[].accessor - Function(row, index) => React node
 * @param {string} [columns[].width] - Column width (e.g., '200px', '10%')
 * @param {'left'|'center'|'right'} [columns[].align='left'] - Text alignment
 * @param {boolean} [columns[].sortable=false] - Enable sorting for this column
 *
 * @param {Object[]} data - Array of row data
 *
 * @param {Object} [pagination]
 * @param {number} pagination.currentPage
 * @param {number} pagination.totalPages
 * @param {number} pagination.totalItems
 * @param {Function} pagination.onPageChange
 *
 * @param {Object} [selectable]
 * @param {string[]} selectable.selectedIds
 * @param {Function} selectable.onSelectChange
 * @param {Function} [selectable.rowKey] - Function(row) => unique key, defaults to row.id
 *
 * @param {Object} [bulkActions] - Actions to show when rows are selected
 *
 * @param {Object} [searchable]
 * @param {string} searchable.value
 * @param {Function} searchable.onChange
 * @param {string} [searchable.placeholder]
 *
 * @param {Object[]} [filters] - Filter controls rendered before the table
 *
 * @param {boolean} [loading=false]
 * @param {string} [emptyTitle]
 * @param {string} [emptyDescription]
 * @param {Function} [emptyAction]
 * @param {string} [className]
 */
const AdminTable = ({
  columns = [],
  data = [],
  pagination,
  selectable,
  bulkActions,
  searchable,
  filters,
  loading = false,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  emptyAction,
  className,
  children,
  title,
  subtitle,
  actions,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const searchValue = searchable?.value ?? internalSearch;
  
  const handleSearchChange = useCallback((val) => {
    if (searchable?.onChange) {
      searchable.onChange(val);
    } else {
      setInternalSearch(val);
    }
  }, [searchable]);

  const allSelected =
    selectable &&
    selectable.selectedIds?.length > 0 &&
    data.length > 0 &&
    selectable.selectedIds.length === data.length;

  const handleSelectAll = useCallback(() => {
    if (!selectable) return;
    if (allSelected) {
      selectable.onSelectChange([]);
    } else {
      const keys = (data || []).map(row => String(selectable.rowKey ? selectable.rowKey(row) : row.id));
      selectable.onSelectChange(keys);
    }
  }, [selectable, allSelected, data]);

  const handleSelectRow = useCallback((key) => {
    if (!selectable) return;
    const current = selectable.selectedIds || [];
    if (current.includes(key)) {
      selectable.onSelectChange(current.filter(k => k !== key));
    } else {
      selectable.onSelectChange([...current, key]);
    }
  }, [selectable]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const showBulkBar = selectable?.selectedIds?.length > 0;

  const colCount = columns.length + (selectable ? 1 : 0);
  const pageSize = pagination?.pageSize || 10;

  const renderHeader = () => (
    <thead>
      <tr className="border-b border-border/50 bg-muted/30">
        {selectable && (
          <th className="w-12 px-4 py-3.5">
            <button
              onClick={handleSelectAll}
              className="flex items-center justify-center icon-btn text-slate-400 hover:text-primary transition-colors"
              aria-label={allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            >
              {allSelected ? (
                <CheckSquare size={16} className="text-primary" />
              ) : (
                <Square size={16} />
              )}
            </button>
          </th>
        )}
        {(columns || []).map((col, idx) => (
          <th
            key={col.key || col.header || idx}
            style={col.width ? { width: col.width, minWidth: col.width } : undefined}
            className={cn(
              'whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
              col.align === 'center' && 'text-center',
              col.align === 'right' && 'text-right',
              col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
              col.headerClassName
            )}
            onClick={col.sortable ? () => handleSort(col.key) : undefined}
          >
            <div className={cn('flex items-center gap-2', col.align === 'right' && 'justify-end', col.align === 'center' && 'justify-center')}>
              {col.header}
              {col.sortable && (
                <ArrowUpDown size={12} className={cn('opacity-40', sortConfig.key === col.key && 'opacity-100 text-primary')} />
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, rowIdx) => (
      <tr key={rowIdx} className="animate-pulse border-b border-border/50">
        {selectable && <td className="w-12 px-5 py-5"><Skeleton className="h-5 w-5 rounded-lg" /></td>}
        {(columns || []).map((col, colIdx) => (
          <td key={colIdx} className="px-5 py-5">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </td>
        ))}
      </tr>
    ));

  const renderRows = () => {
    if (sortedData.length === 0) {
      return (
        <tr>
          <td colSpan={colCount} className="px-4 py-20 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{emptyTitle}</p>
                {emptyDescription && (
                  <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
                )}
                {emptyAction && (
                  <button
                    onClick={emptyAction.onClick}
                    className="mt-4 h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {emptyAction.label}
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      );
    }

    return sortedData.map((row, rowIdx) => {
      const rowKey = String(selectable?.rowKey ? selectable.rowKey(row) : (row.id ?? rowIdx));
      const isSelected = selectable?.selectedIds?.includes(rowKey);

      return (
        <tr
          key={rowKey}
          className={cn(
            'group border-b border-border/50 transition-all duration-200',
            isSelected
              ? 'bg-primary/[0.04]'
              : 'hover:bg-muted/40'
          )}
        >
          {selectable && (
            <td className="w-12 px-5 py-4">
              <button
                onClick={() => handleSelectRow(rowKey)}
                className="flex items-center justify-center icon-btn text-slate-400 hover:text-primary transition-colors"
                aria-label={isSelected ? 'Bỏ chọn' : 'Chọn'}
              >
                {isSelected ? (
                  <CheckSquare size={16} className="text-primary" />
                ) : (
                  <Square size={16} />
                )}
              </button>
            </td>
          )}
          {columns.map(col => {
            const cellValue = col.key ? row[col.key] : row;
            let content;

            if (col.render) {
              content = col.render(cellValue, row, rowIdx);
            } else if (typeof col.accessor === 'function') {
              content = col.accessor(row, rowIdx);
            } else {
              content = cellValue;
            }

            return (
              <td
                key={col.key || col.header}
                className={cn(
                  'px-5 py-4 text-sm leading-relaxed text-foreground',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.cellClassName
                )}
              >
                {content}
              </td>
            );
          })}
        </tr>
      );
    });
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header Section */}
      {(title || actions || filters || searchable) && (
        <div className="mb-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Title & Subtitle */}
            {(title || subtitle) && (
              <div>
                {title && <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>}
                {subtitle && <p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p>}
              </div>
            )}

            {/* Actions */}
            {actions && <div className="flex items-center gap-2">{actions}</div>}

            {/* Filters + Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
              {searchable && (
                <div className="relative w-full sm:w-72 sm:shrink-0">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Search size={16} strokeWidth={2.5} className="text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={searchable.placeholder || 'Tìm kiếm...'}
                    className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground transition-[color,background-color,border-color,box-shadow] duration-200 hover:border-primary/20 focus:border-primary/35 focus:outline-none focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkBar && bulkActions && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3 shadow-sm backdrop-blur-sm animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <CheckSquare size={16} />
            </div>
            <span className="text-sm font-medium text-foreground">
              Đã chọn <span className="font-bold text-primary">{selectable.selectedIds.length}</span> mục
            </span>
            <button
              onClick={() => selectable.onSelectChange([])}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-lg icon-btn text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">{bulkActions}</div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[600px]">
            {renderHeader()}
            <tbody className="divide-y divide-border/50">
              {loading ? renderSkeletonRows() : (children || renderRows())}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && !loading && sortedData.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border/50 px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              {pagination.totalItems > 0 ? (
                <>
                  Hiển thị{' '}
                  <span className="font-semibold text-foreground">
                    {((pagination.currentPage - 1) * pageSize) + 1}
                  </span>
                  {' – '}
                  <span className="font-semibold text-foreground">
                    {Math.min(pagination.currentPage * pageSize, pagination.totalItems)}
                  </span>
                  {' '}trên{' '}
                  <span className="font-semibold text-foreground">{pagination.totalItems}</span>
                </>
              ) : (
                'Không có kết quả'
              )}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => pagination.onPageChange?.(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="h-10 w-10 rounded-xl border border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <ChevronLeft size={14} />
              </Button>
              <div className="flex h-10 items-center rounded-xl border border-border/50 bg-muted/30 px-4 text-sm font-medium text-foreground">
                {pagination.currentPage} / {pagination.totalPages || 1}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => pagination.onPageChange?.(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= (pagination.totalPages || 1)}
                className="h-10 w-10 rounded-xl border border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AdminTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      header: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      accessor: PropTypes.func,
      width: PropTypes.string,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      sortable: PropTypes.bool,
      headerClassName: PropTypes.string,
      cellClassName: PropTypes.string,
    })
  ).isRequired,
  data: PropTypes.array,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    totalItems: PropTypes.number,
    pageSize: PropTypes.number,
    onPageChange: PropTypes.func,
  }),
  selectable: PropTypes.shape({
    selectedIds: PropTypes.arrayOf(PropTypes.string),
    onSelectChange: PropTypes.func,
    rowKey: PropTypes.func,
  }),
  bulkActions: PropTypes.node,
  searchable: PropTypes.shape({
    value: PropTypes.string,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
  }),
  filters: PropTypes.node,
  loading: PropTypes.bool,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  emptyAction: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
  }),
  className: PropTypes.string,
  children: PropTypes.node,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
};

export default AdminTable;
