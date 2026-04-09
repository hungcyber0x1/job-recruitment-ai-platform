import PropTypes from 'prop-types';
import React from 'react';
import { NavLink } from 'react-router-dom';

const renderLink = (item) => (
  <NavLink
    key={item.path}
    to={item.path}
    className={({ isActive }) => `
      group relative flex items-center gap-4 px-6 py-3.5 transition-all duration-300
      ${
        isActive
          ? 'bg-emerald-950/40 text-emerald-400'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
      }
    `}
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
        )}
        <span
          className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
        >
          {React.cloneElement(item.icon, { size: 18, strokeWidth: isActive ? 2.5 : 2 })}
        </span>
        <span className="text-sm font-bold tracking-wide">{item.label}</span>
      </>
    )}
  </NavLink>
);

const Navigation = ({ items, className = '' }) => {
  const isGrouped = items.length > 0 && Array.isArray(items[0]?.items);

  return (
    <nav className={`flex flex-col gap-1 ${className}`}>
      {isGrouped
        ? items.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <div className="px-3 pt-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                {group.title}
              </div>
              <div className="flex flex-col gap-1">{group.items.map(renderLink)}</div>
            </div>
          ))
        : items.map(renderLink)}
    </nav>
  );
};

Navigation.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.shape({
        path: PropTypes.string.isRequired,
        label: PropTypes.node.isRequired,
        icon: PropTypes.node,
      }),
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(
          PropTypes.shape({
            path: PropTypes.string.isRequired,
            label: PropTypes.node.isRequired,
            icon: PropTypes.node,
          })
        ).isRequired,
      }),
    ])
  ).isRequired,
  className: PropTypes.string,
};

export default Navigation;
