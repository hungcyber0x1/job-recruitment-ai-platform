import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';
import EmptyState from './EmptyState';

const ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const Table = ({
  columns = [],
  data = [],
  getRowKey,
  loading = false,
  emptyTitle = 'Khong co du lieu',
  emptyDescription,
  emptyAction,
  className,
  tableClassName,
  children,
}) => {
  const colSpan = Math.max(columns.length, 1);

  return (
    <div className={cn('data-table-shell rounded-2xl', className)}>
      <div className="data-table-scroll">
        <table className={cn('data-table min-w-[600px]', tableClassName)}>
          {columns.length > 0 && (
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.key || column.header || index}
                    style={
                      column.width ? { width: column.width, minWidth: column.width } : undefined
                    }
                    className={cn(
                      'px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground',
                      ALIGN[column.align] || ALIGN.left,
                      column.headerClassName
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {children}
            {!children &&
              loading &&
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td key={column.key || colIndex} className="px-5 py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))}
            {!children && !loading && data.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-6 py-10">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    className="border-0 shadow-none"
                  />
                </td>
              </tr>
            )}
            {!children &&
              !loading &&
              data.map((row, rowIndex) => (
                <tr
                  key={getRowKey ? getRowKey(row, rowIndex) : (row.id ?? rowIndex)}
                  className="ui-hover-row"
                >
                  {columns.map((column, colIndex) => {
                    const value = column.key ? row[column.key] : row;
                    const content = column.render
                      ? column.render(value, row, rowIndex)
                      : column.accessor
                        ? column.accessor(row, rowIndex)
                        : value;

                    return (
                      <td
                        key={column.key || colIndex}
                        className={cn(
                          'px-5 py-4 text-sm leading-6 text-foreground',
                          ALIGN[column.align] || ALIGN.left,
                          column.cellClassName
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      header: PropTypes.node,
      render: PropTypes.func,
      accessor: PropTypes.func,
      width: PropTypes.string,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      headerClassName: PropTypes.string,
      cellClassName: PropTypes.string,
    })
  ),
  data: PropTypes.array,
  getRowKey: PropTypes.func,
  loading: PropTypes.bool,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  emptyAction: PropTypes.node,
  className: PropTypes.string,
  tableClassName: PropTypes.string,
  children: PropTypes.node,
};

export default Table;
