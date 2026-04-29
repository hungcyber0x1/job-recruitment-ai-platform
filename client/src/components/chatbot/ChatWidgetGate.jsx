import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useFeatureFlags } from '../../context/FeatureFlagsContext';

const ChatWidget = React.lazy(() => import('./ChatWidget'));

/** Bubble chat: chỉ khi đã đăng nhập + bật ai_chatbot (trang /chat cũng bọc PrivateRoute). */
const ChatWidgetGate = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const { pathname } = useLocation();

  const hireAi = isEnabled('ai_chatbot');
  const isDedicatedChatSurface =
    pathname === '/chat' ||
    pathname === '/candidate/chat' ||
    pathname.startsWith('/admin/chatbot');

  if (loading || !isAuthenticated || !hireAi) {
    return null;
  }

  if (pathname === '/login' || pathname === '/register' || isDedicatedChatSurface) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      {/* key: đóng/mở panel & state cục bộ theo user — không dính phiên trước */}
      <ChatWidget key={user?.id ?? 'me'} />
    </Suspense>
  );
};

export default ChatWidgetGate;
