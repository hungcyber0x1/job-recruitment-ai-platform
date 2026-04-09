/**
 * Barrel: providers + hooks — import gọn từ `@/context` hoặc `./context`.
 */
export { AuthContext, AuthProvider, useAuth } from './AuthContext';
export { NotificationProvider, useNotification } from './NotificationContext';
export { ChatProvider, useChat } from './ChatContext';
export { ThemeProvider, useTheme } from './ThemeContext';
export { FeatureFlagsProvider, useFeatureFlags } from './FeatureFlagsContext';
