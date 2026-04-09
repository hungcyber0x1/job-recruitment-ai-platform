import React from 'react';
import PropTypes from 'prop-types';

const Loading = ({ size = 'md', text, className = '' }) => {
  // Map legacy sizes from LoadingSpinner (small, medium, large) to current sizes (sm, md, lg)
  const sizeMap = {
    small: 'sm',
    medium: 'md',
    large: 'lg',
  };

  const finalSize = sizeMap[size] || size;

  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizes[finalSize]} border-primary border-t-transparent rounded-full animate-spin`}
      ></div>
      {text && <p className="mt-3 text-gray-600 font-medium">{text.replace('...', '…')}</p>}
      {!text && <p className="mt-3 text-gray-400 text-sm font-medium italic">Đang tải…</p>}
    </div>
  );
};

Loading.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'small', 'medium', 'large']),
  text: PropTypes.string,
  className: PropTypes.string,
};

export default Loading;
