import PropTypes from 'prop-types';
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading.jsx';
import { getDashboardPath, normalizeAuthRole } from '../utils/rolePaths';
import { hasAdminPermission } from '../utils/adminPermissions';

const PrivateRoute = ({ children, roles, adminPermission }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loading size="lg" />
        <p className="text-base text-muted-foreground">Đang kiểm tra phiên đăng nhập…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user?.role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = normalizeAuthRole(user.role);
  const allowedRoles = roles?.map(normalizeAuthRole);

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  if (adminPermission && userRole === 'admin' && !hasAdminPermission(user, adminPermission)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminPermission: PropTypes.string,
  roles: PropTypes.arrayOf(PropTypes.string),
};

PrivateRoute.defaultProps = {
  adminPermission: undefined,
  roles: undefined,
};

export default PrivateRoute;
