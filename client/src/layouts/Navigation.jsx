/**
 * Navigation — Enterprise Command Center Style
 * 
 * Thiết kế theo mô hình 3-tier:
 * ★ Tier 1 — Truy cập nhanh: Dashboard, Jobs, Applications, Saved
 * ★ Tier 2 — Hồ sơ & Quản lý: Profile, Resume, Settings
 * ★ Tier 3 — AI & Chiến lược: Chatbot, Suggestions, Blog
 * 
 * Nguyên tắc thiết kế:
 * - Active state với indicator bar bên trái
 * - Hover effect với scale + glow
 * - Collapsed mode: icon + tooltip
 * - Expanded mode: icon + label
 * - Badge count cho notification items
 */
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils';

/**
 * Single navigation link with enterprise styling
 */
const NavItem = ({ item, collapsed }) => {
  const { path, label, icon: Icon, badgeCount } = item;

  return (
    <NavLink
      to={path}
      end={path === '/candidate/dashboard' || path === '/'}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center rounded-lg transition-colors duration-200',
          'hover:bg-white/5',
          collapsed 
            ? 'justify-center mx-1 w-[calc(100%-8px)] py-3 px-0' 
            : 'gap-3.5 mx-2 py-3 px-4',
          isActive
            ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
            : 'text-slate-500'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && (
            <span
              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_hsl(var(--primary)_/_0.6)]"
              aria-hidden
            />
          )}

          {/* Icon */}
          <span
            className={cn(
              'shrink-0 transition-colors duration-200',
              isActive
                ? 'text-primary'
                : 'text-slate-600 group-hover:text-slate-300'
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          </span>

          {/* Label */}
          {!collapsed && (
            <span 
              className={cn(
                'min-w-0 flex-1 truncate text-sm font-semibold tracking-normal transition-colors duration-200',
                isActive 
                  ? 'text-slate-100' 
                  : 'text-slate-500 group-hover:text-slate-200'
              )}
            >
              {label}
            </span>
          )}

          {/* Badge */}
          {!collapsed && badgeCount > 0 && (
            <span 
              className={cn(
                'shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full text-xs font-bold transition-colors',
                isActive 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-slate-700 text-slate-300'
              )}
            >
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

NavItem.propTypes = {
  item: PropTypes.shape({
    path: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    badgeCount: PropTypes.number,
  }).isRequired,
  collapsed: PropTypes.bool,
};

/**
 * Navigation group with title
 */
const NavGroup = ({ group, collapsed }) => {
  const { title, items } = group;

  return (
    <div className="mb-6">
      {/* Group title */}
      {!collapsed && (
        <div className="mb-2 px-4">
          <span className="text-xs font-bold uppercase tracking-normal text-slate-600">
            {title.replace(/^[IVX]+\.\s*/, '')}
          </span>
        </div>
      )}

      {/* Group items */}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
};

NavGroup.propTypes = {
  group: PropTypes.shape({
    title: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        path: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        icon: PropTypes.elementType.isRequired,
        badgeCount: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
  collapsed: PropTypes.bool,
};

/**
 * Main Navigation component
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of nav items or groups
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.collapsed - Collapsed mode (icon only)
 */
const Navigation = ({ items, className = '', collapsed = false }) => {
  const isGrouped = items.length > 0 && Array.isArray(items[0]?.items);

  const renderNavItem = useCallback(
    (item) => <NavItem key={item.path} item={item} collapsed={collapsed} />,
    [collapsed]
  );

  return (
    <nav 
      className={cn(
        'flex flex-col gap-1',
        className
      )}
    >
      {isGrouped ? (
        items.map((group) => (
          <NavGroup key={group.title} group={group} collapsed={collapsed} />
        ))
      ) : (
        items.map(renderNavItem)
      )}
    </nav>
  );
};

Navigation.propTypes = {
  /** Array of nav items or nav groups */
  items: PropTypes.arrayOf(
    PropTypes.oneOfType([
      // Single item
      PropTypes.shape({
        path: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        icon: PropTypes.elementType.isRequired,
        badgeCount: PropTypes.number,
      }),
      // Group
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(
          PropTypes.shape({
            path: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            icon: PropTypes.elementType.isRequired,
            badgeCount: PropTypes.number,
          })
        ).isRequired,
      }),
    ])
  ).isRequired,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Collapsed mode (icon only) */
  collapsed: PropTypes.bool,
};

export default Navigation;
