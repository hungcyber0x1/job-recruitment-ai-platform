// Cây provider toàn app: auth, thông báo, theme, feature flags, chat; bọc router + route.
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import {
  AuthProvider,
  ChatProvider,
  FeatureFlagsProvider,
  NotificationProvider,
  ThemeProvider,
} from './context';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ThemeProvider>
          <AuthProvider>
            <FeatureFlagsProvider>
              <ChatProvider>
                <Router>
                  <AppRoutes />
                </Router>
              </ChatProvider>
            </FeatureFlagsProvider>
          </AuthProvider>
        </ThemeProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
