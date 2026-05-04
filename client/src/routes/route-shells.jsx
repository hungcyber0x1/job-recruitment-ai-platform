/**
 * Cách bọc route: public (chỉ Suspense), candidate/recruiter (PrivateRoute + layout + Suspense),
 * admin (PrivateRoute + Suspense — từng page tự bọc AdminLayout).
 */
import React, { Suspense } from 'react';
import PrivateRoute from '../layouts/PrivateRoute.jsx';
import Loading from '../components/common/Loading.jsx';
import CandidateLayout from '../layouts/CandidateLayout.jsx';
import EmployerLayout from '../layouts/EmployerLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';

export const routeLoadingFallback = (
  <div className="flex min-h-[40vh] items-center justify-center bg-background">
    <Loading size="lg" />
  </div>
);

/** Nội dung trong khung dashboard — layout cha giữ nguyên khi đổi tab */
export const dashboardContentLoadingFallback = (
  <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-border/40 bg-muted/15">
    <Loading size="md" />
  </div>
);

export const renderLazyPage = (Component) => (
  <Suspense fallback={routeLoadingFallback}>
    <Component />
  </Suspense>
);

/** Trang cần đăng nhập (mọi role) — không giới hạn candidate/recruiter/admin. */
export const renderAuthLazyPage = (Component) => (
  <PrivateRoute>
    <Suspense fallback={routeLoadingFallback}>
      <Component />
    </Suspense>
  </PrivateRoute>
);

export const renderCandidatePage = (Component) => (
  <PrivateRoute roles={['candidate']}>
    <CandidateLayout>
      <Suspense fallback={dashboardContentLoadingFallback}>
        <Component />
      </Suspense>
    </CandidateLayout>
  </PrivateRoute>
);

export const renderRecruiterPage = (Component) => (
  <PrivateRoute roles={['recruiter']}>
    <EmployerLayout>
      <Suspense fallback={dashboardContentLoadingFallback}>
        <Component />
      </Suspense>
    </EmployerLayout>
  </PrivateRoute>
);

export const renderAdminPage = (Component, options = {}) => (
  <PrivateRoute roles={['admin']} adminPermission={options.adminPermission}>
    <AdminLayout>
      <Suspense fallback={dashboardContentLoadingFallback}>
        <Component />
      </Suspense>
    </AdminLayout>
  </PrivateRoute>
);
