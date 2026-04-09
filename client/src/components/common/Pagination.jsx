import PropTypes from 'prop-types';
import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Calculate pages directly during render
  const pages = (() => {
    const range = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        range.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        range.push('...');
      }
    }
    return [...new Set(range)];
  })();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-xl border border-secondary-200 bg-paper text-txt-light hover:text-primary-600 disabled:opacity-30 transition-all font-bold"
      >
        <ChevronLeft size={20} />
      </button>

      {pages.map((page, index) =>
        page === '...' ? (
          <span key={index} className="px-4 py-2 text-txt-muted">
            <MoreHorizontal size={16} />
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-xl font-bold transition-all ${
              currentPage === page
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-100'
                : 'bg-paper text-txt-muted border border-secondary-200 hover:border-primary-600 hover:text-primary-600'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl border border-secondary-200 bg-paper text-txt-light hover:text-primary-600 disabled:opacity-30 transition-all font-bold"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;
