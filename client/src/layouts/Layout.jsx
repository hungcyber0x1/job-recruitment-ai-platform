import PropTypes from 'prop-types';
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children, useSidebar = false }) => {
  const { user } = useAuth();

  return (
    <div className={`min-h-screen bg-background flex flex-col ${!useSidebar ? 'pt-28' : ''}`}>
      {!useSidebar && <Header />}

      <div className="flex flex-1">
        {useSidebar && user && <Sidebar role={user.role} />}

        <main className={`flex-1 ${useSidebar ? 'bg-background overflow-y-auto' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  useSidebar: PropTypes.bool,
};

Layout.defaultProps = {
  useSidebar: false,
};

export default Layout;
