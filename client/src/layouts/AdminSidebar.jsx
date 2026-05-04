import PropTypes from 'prop-types';
import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { Logo } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils';
import { resolveMediaUrl } from '@/utils/mediaUrl';

const isAdminNavActive = (pathname, path) => {
  if (path === '/admin/dashboard') return pathname === '/admin/dashboard';
  return pathname === path || pathname.startsWith(`${path}/`);
};

const getAdminDisplayName = (user) => {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return user?.fullName || fullName || user?.name || 'Quản trị viên';
};

const getInitial = (user) =>
  (user?.first_name?.[0] || user?.fullName?.[0] || user?.name?.[0] || 'A').toUpperCase();

const AdminSidebar = ({ groups, user, badgeCounts = {}, onNavigate }) => {
  const location = useLocation();
  const adminName = getAdminDisplayName(user);
  const avatarSrc = resolveMediaUrl(user?.avatar_url) || undefined;

  return (
    <div className="z-50 flex h-full w-64 flex-col border-r border-slate-800 bg-[#0B1120] text-slate-200">
      <div className="border-b border-slate-800 bg-gradient-to-br from-primary/[0.12] via-primary/[0.05] to-transparent px-5 py-5">
        <Link
          to="/admin/dashboard"
          className="group flex w-full flex-col items-center gap-3 text-center"
          onClick={() => onNavigate?.()}
        >
          <Logo
            asLink={false}
            className="mx-auto h-10 w-auto max-w-[172px] object-center transition-transform duration-200 group-hover:scale-[1.02]"
          />
          <span className="hidden min-w-0 truncate text-lg font-black tracking-tight text-slate-50">
            Admin
            <span className="text-primary"> Hub</span>
          </span>
          <div className="space-y-1 text-center">
            <p className="text-base font-semibold text-slate-50">Quản trị hệ thống</p>
            <p className="text-xs font-medium text-slate-400">Điều hành và giám sát nền tảng</p>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 px-3 text-sm font-bold uppercase tracking-widest text-slate-500">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isAdminNavActive(location.pathname, item.path);
                  const count = item.badgeKey ? Number(badgeCounts[item.badgeKey] || 0) : 0;

                  return (
                    <NavLink
                      key={`${group.title}-${item.path}`}
                      to={item.path}
                      end={item.path === '/admin/dashboard'}
                      onClick={() => onNavigate?.()}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-all duration-200',
                        active
                          ? 'bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                      )}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_hsl(var(--primary)_/_0.45)]"
                          aria-hidden
                        />
                      )}
                      <Icon
                        size={20}
                        className={cn(
                          'shrink-0 transition-transform duration-200 group-hover:scale-105',
                          active ? 'text-primary' : 'text-slate-500 group-hover:text-primary'
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <Badge className="h-6 min-w-6 rounded-full border border-primary/25 bg-primary/15 px-2 text-sm font-semibold text-primary">
                          {count > 99 ? '99+' : count}
                        </Badge>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-slate-800 p-4">
        <Link
          to="/admin/profile"
          onClick={() => onNavigate?.()}
          className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-3.5 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/10"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-sm transition-transform group-hover:scale-[1.02]">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-base font-bold text-primary">{getInitial(user)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-base font-semibold text-slate-100 transition-colors group-hover:text-primary">
              {adminName}
            </p>
            <p className="truncate text-base font-bold uppercase tracking-widest text-primary">
              Quản trị viên
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

AdminSidebar.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          path: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          icon: PropTypes.elementType.isRequired,
          badgeKey: PropTypes.string,
        })
      ).isRequired,
    })
  ).isRequired,
  user: PropTypes.object,
  badgeCounts: PropTypes.object,
  onNavigate: PropTypes.func,
};

export default AdminSidebar;
