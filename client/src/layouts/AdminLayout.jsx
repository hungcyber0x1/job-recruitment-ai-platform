import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import { filterAdminNavGroups } from '@/config/adminNavigation';
import { cn } from '@/utils';
import { useAuth } from '../context/AuthContext';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navGroups = useMemo(() => filterAdminNavGroups(user), [user]);

  return (
    <div className="role-admin-workspace-bg flex min-h-screen">
      <aside className="z-50 hidden w-64 lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <AdminSidebar groups={navGroups} user={user} />
      </aside>

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-md lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[70] w-64 transition-transform duration-300 lg:hidden',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <AdminSidebar
          groups={navGroups}
          user={user}
          onNavigate={() => setIsMobileSidebarOpen(false)}
        />
      </aside>

      <div className="role-admin-workspace-bg flex min-h-screen flex-1 flex-col text-foreground lg:pl-64">
        <AdminHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main className="role-rounded-workspace flex-1 bg-transparent p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminLayout;
