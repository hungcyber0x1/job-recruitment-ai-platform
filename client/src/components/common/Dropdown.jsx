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
        <div className="absolute right-0 z-50 mt-3 w-56 origin-top-right overflow-hidden rounded-2xl border border-border/80 bg-card py-2 shadow-xl animate-fade-in animate-slide-up">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                item.onClick?.();
                setIsOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors',
                item.danger
                  ? 'text-danger hover:bg-danger/10'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
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
