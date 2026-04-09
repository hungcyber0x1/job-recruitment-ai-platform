import PropTypes from 'prop-types';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';

const Dropdown = ({ trigger, items, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-paper rounded-2xl shadow-md border border-secondary-100 py-2 z-50 animate-fade-in animate-slide-up origin-top-right">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                item.onClick?.();
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-5 py-2.5 flex items-center gap-3 text-sm font-semibold transition-colors',
                item.danger
                  ? 'text-error-600 hover:bg-error-50 hover:text-error-700'
                  : 'text-txt-muted hover:bg-secondary-50 hover:text-primary-600'
              )}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

Dropdown.propTypes = {
  trigger: PropTypes.node.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      icon: PropTypes.node,
      danger: PropTypes.bool,
      onClick: PropTypes.func,
    })
  ).isRequired,
  className: PropTypes.string,
};

Dropdown.defaultProps = {
  className: '',
};

export default Dropdown;
