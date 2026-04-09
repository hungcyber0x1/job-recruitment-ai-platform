/**
 * Lớp ngoài routing: chờ auth, chọn layout (marketing vs dashboard), gắn widget chat.
 * Định nghĩa path cụ thể nằm trong MainRoutes.jsx + lazy-pages.js.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../utils';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading.jsx';
import ModernLayout from '../layouts/ModernLayout.jsx';
import ChatWidgetGate from '../components/chatbot/ChatWidgetGate.jsx';
import MainRoutes from './MainRoutes.jsx';

const AppRoutes = () => {
  const location = useLocation();
  const { loading } = useAuth();

  const isDashboardRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/candidate') ||
    location.pathname.startsWith('/employer');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-background font-sans text-foreground')}>
      {isDashboardRoute ? (
        <main className="flex-grow">
          <MainRoutes />
        </main>
      ) : (
        <ModernLayout>
          <MainRoutes />
        </ModernLayout>
      )}
      <ChatWidgetGate />
    </div>
  );
};

export default AppRoutes;
