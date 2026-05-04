import PropTypes from 'prop-types';
import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import chatbotService from '../services/chatbotService';
import { useAuth } from './AuthContext';
import { useFeatureFlags } from './FeatureFlagsContext';
import { SOCKET_ORIGIN } from '../config';
import { createClientId } from '../utils/clientId';

const MAX_MESSAGE_LENGTH = 10000; // Safety limit
const isAuthError = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

const isSocketDebugEnabled = () =>
  typeof window !== 'undefined' && window.localStorage?.getItem('chat_socket_debug') === '1';

const logSocketDebug = (method, ...args) => {
  if (!isSocketDebugEnabled()) return;
  if (method === 'error') {
    console.error(...args);
    return;
  }
  console.warn(...args);
};

const noopAsync = async () => {};

const CHAT_CONTEXT_DEFAULT_VALUE = {
  messages: [],
  conversations: [],
  activeConversation: null,
  isLoading: false,
  suggestedQuestions: [],
  chatbotEnabled: false,
  sendMessage: noopAsync,
  createConversation: noopAsync,
  renameConversation: noopAsync,
  deleteConversation: noopAsync,
  clearHistory: noopAsync,
  uploadFile: noopAsync,
  switchConversation: () => {},
  fetchConversations: noopAsync,
  fetchHistory: noopAsync,
};

const ChatContext = createContext(CHAT_CONTEXT_DEFAULT_VALUE);

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const chatbotEnabled = isEnabled('ai_chatbot');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const socketRef = useRef(null);
  /** Tránh hiện tin nhắn / hội thoại của phiên trước khi đổi user hoặc sau logout → login. */
  const chatSessionUserIdRef = useRef(null);
  const fetchConversationsRef = useRef(null);
  const fetchSuggestedQuestionsRef = useRef(null);
  /** Tránh kẹt loading khi emit socket mà server không trả chat:response / chat:error */
  const socketLoadingTimeoutRef = useRef(null);
  const socketAttemptRef = useRef(0);

  const clearSocketLoadingTimeout = useCallback(() => {
    if (socketLoadingTimeoutRef.current) {
      clearTimeout(socketLoadingTimeoutRef.current);
      socketLoadingTimeoutRef.current = null;
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !chatbotEnabled) {
      setConversations([]);
      return;
    }

    try {
      const response = await chatbotService.getConversations();
      const list = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      setConversations(list);

      if (!activeConversation && list.length > 0) {
        setActiveConversation(list[0].id);
      } else if (
        activeConversation &&
        !list.some((conversation) => conversation.id === activeConversation)
      ) {
        setActiveConversation(list[0]?.id || null);
      }
    } catch (error) {
      if (isAuthError(error)) {
        setConversations([]);
        setActiveConversation(null);
        return;
      }
      console.error('Failed to fetch conversations:', error);
    }
  }, [activeConversation, authLoading, chatbotEnabled, isAuthenticated]);

  const fetchHistory = useCallback(async () => {
    if (authLoading || !isAuthenticated || !activeConversation || !chatbotEnabled) return;

    try {
      const response = await chatbotService.getHistory(activeConversation);
      const rawData = response.data?.data || response.data || [];
      const msgs = Array.isArray(rawData) ? rawData : [];
      const history = msgs.map((msg) => ({
        id: msg.id,
        text: msg.message,
        isAi: msg.is_ai,
        createdAt: msg.created_at,
        attachmentUrl: msg.attachment_url,
        attachmentType: msg.attachment_type,
      }));
      setMessages(history);
    } catch (error) {
      if (isAuthError(error)) {
        setMessages([]);
        return;
      }
      console.error('Failed to fetch chat history:', error);
    }
  }, [activeConversation, authLoading, chatbotEnabled, isAuthenticated]);

  const fetchSuggestedQuestions = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !chatbotEnabled) {
      setSuggestedQuestions([]);
      return;
    }

    try {
      const response = await chatbotService.getSuggestedQuestions();
      const questions = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      setSuggestedQuestions(questions);
    } catch (error) {
      if (isAuthError(error)) {
        setSuggestedQuestions([]);
        return;
      }
      console.error('Failed to fetch suggested questions:', error);
    }
  }, [authLoading, chatbotEnabled, isAuthenticated]);

  fetchConversationsRef.current = fetchConversations;
  fetchSuggestedQuestionsRef.current = fetchSuggestedQuestions;

  useEffect(() => {
    if (authLoading || !isAuthenticated || !chatbotEnabled) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return undefined;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const { io } = await import('socket.io-client');
        if (cancelled) return;

        const socket = io(SOCKET_ORIGIN, {
          auth: { token },
          path: '/socket.io',
          /**
           * Ưu tiên websocket nhưng cho phép polling fallback để tránh lỗi trắng khi proxy/gateway
           * không hỗ trợ nâng cấp WebSocket trong môi trường dev hoặc reverse proxy.
           */
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 2,
          timeout: 10000,
        });

        if (cancelled) {
          socket.disconnect();
          return;
        }

        socketRef.current = socket;

        socket.on('connect', () => {
          socketAttemptRef.current = 0;
          logSocketDebug('info', '[Socket] Connected:', socket.id);
        });

        socket.on('disconnect', (reason) => {
          logSocketDebug('info', '[Socket] Disconnected:', socket.id, reason);
        });

        socket.on('connect_error', (err) => {
          socketAttemptRef.current += 1;
          logSocketDebug('warn', '[Socket] Connection error:', err.message);
          if (err.message && err.message.includes('Authentication error')) {
            socket.disconnect();
            socket.emit('auth:invalidated', { message: err.message });
            return;
          }

          if (socketAttemptRef.current >= 2) {
            socket.disconnect();
            socketRef.current = null;
          }
        });

        socket.on('auth:invalidated', () => {
          console.warn('[Socket] Auth invalidated — server restarted or token expired');
          socket.disconnect();
          socketRef.current = null;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.history.pushState(null, '', '/login');
          window.dispatchEvent(new PopStateEvent('popstate'));
        });

        socket.on('chat:response', (data) => {
          clearSocketLoadingTimeout();
          // If we're in streaming mode, finalize the streaming message instead of adding a new one
          if (streamingMessageId) {
            const rawText = data?.message || '';
            const truncatedText =
              String(rawText).length > MAX_MESSAGE_LENGTH
                ? String(rawText).slice(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
                : rawText;
            setMessages((prev) => {
              const lastIdx = prev.length - 1;
              if (lastIdx >= 0 && prev[lastIdx].id === streamingMessageId) {
                const updated = [...prev];
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  text: truncatedText || updated[lastIdx].text || '...',
                  isStreaming: false,
                  createdAt: data?.timestamp,
                };
                return updated;
              }
              // Fallback: add new message if streaming message not found
              return [
                ...prev,
                {
                  id: createClientId(),
                  text: truncatedText,
                  isAi: true,
                  createdAt: data?.timestamp,
                },
              ];
            });
            setStreamingMessageId(null);
            setIsLoading(false);
          } else {
            // Non-streaming mode: add the complete response as a new message
            const rawText = data?.message || '';
            const truncatedText =
              String(rawText).length > MAX_MESSAGE_LENGTH
                ? String(rawText).slice(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
                : rawText;
            setMessages((prev) => [
              ...prev,
              { id: createClientId(), text: truncatedText, isAi: true, createdAt: data?.timestamp },
            ]);
            setIsLoading(false);
          }
          const nextConvId = data?.conversationId;
          if (nextConvId != null) {
            setActiveConversation((current) => {
              if (current == null) {
                fetchConversationsRef.current?.();
                return nextConvId;
              }
              return current;
            });
          }
        });

        socket.on('chat:chunk', (data) => {
          // Handle streaming chunks for real-time display
          if (streamingMessageId) {
            const chunk = data?.chunk || '';
            setMessages((prev) => {
              const lastIdx = prev.length - 1;
              if (lastIdx >= 0 && prev[lastIdx].id === streamingMessageId) {
                const updated = [...prev];
                const newText = updated[lastIdx].text + chunk;
                if (String(newText).length <= MAX_MESSAGE_LENGTH) {
                  updated[lastIdx] = { ...updated[lastIdx], text: newText };
                }
                return updated;
              }
              return prev;
            });
          }
        });

        socket.on('chat:typing', (data) => {
          if (data?.isTyping && !streamingMessageId) {
            // Create a placeholder streaming message
            const tempId = createClientId();
            setStreamingMessageId(tempId);
            setMessages((prev) => [
              ...prev,
              { id: tempId, text: '', isAi: true, isStreaming: true },
            ]);
          } else if (!data?.isTyping && streamingMessageId) {
            // Finalize the streaming message
            setMessages((prev) => {
              const lastIdx = prev.length - 1;
              if (lastIdx >= 0 && prev[lastIdx].id === streamingMessageId) {
                const updated = [...prev];
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  text: updated[lastIdx].text || '...',
                  isStreaming: false,
                };
                return updated;
              }
              return prev;
            });
            setStreamingMessageId(null);
            setIsLoading(false);
          }
        });

        socket.on('chat:error', (error) => {
          clearSocketLoadingTimeout();
          logSocketDebug('error', 'Socket error:', error);
          // Clear streaming state if error occurs
          if (streamingMessageId) {
            setMessages((prev) => prev.filter((m) => m.id !== streamingMessageId));
            setStreamingMessageId(null);
          }
          setIsLoading(false);
          const text =
            (typeof error?.message === 'string' && error.message.trim()) ||
            'AI chatbot hiện chưa sẵn sàng. Vui lòng thử lại sau.';
          setMessages((prev) => [...prev, { id: createClientId(), text, isAi: true }]);
        });
      } catch (e) {
        console.error('Failed to load socket.io client:', e);
      }
    })();

    return () => {
      cancelled = true;
      clearSocketLoadingTimeout();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [authLoading, chatbotEnabled, isAuthenticated, clearSocketLoadingTimeout]);

  const sendMessage = async (text) => {
    if (!isAuthenticated) {
      return;
    }
    // Truncate input to prevent abuse
    const safeText = String(text || '').slice(0, MAX_MESSAGE_LENGTH);

    if (!chatbotEnabled) {
      setMessages((prev) => [
        ...prev,
        {
          id: createClientId(),
          text: 'AI chatbot is currently disabled by admin settings.',
          isAi: true,
        },
      ]);
      return;
    }

    const userMsg = { id: createClientId(), text: safeText, isAi: false };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (socketRef.current && socketRef.current.connected) {
      clearSocketLoadingTimeout();
      socketLoadingTimeoutRef.current = setTimeout(() => {
        socketLoadingTimeoutRef.current = null;
        setIsLoading(false);
      }, 120_000);
      socketRef.current.emit('chat:message', {
        message: safeText,
        conversationId: activeConversation,
      });
    } else {
      try {
        const response = await chatbotService.sendMessage(safeText, activeConversation);
        // Truncate AI response
        const rawText = response.data?.data?.message || response.data?.message || '';
        const truncatedText =
          String(rawText).length > MAX_MESSAGE_LENGTH
            ? String(rawText).slice(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
            : rawText;
        const aiMsg = {
          id: createClientId(),
          text: truncatedText,
          isAi: true,
        };
        setMessages((prev) => [...prev, aiMsg]);

        const nextConversationId =
          response.data?.data?.conversationId || response.data?.conversationId;
        if (nextConversationId && !activeConversation) {
          setActiveConversation(nextConversationId);
          fetchConversations();
        }
      } catch (error) {
        console.error('Chat error:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: createClientId(),
            text:
              error.response?.data?.message ||
              'AI chatbot hiện chưa sẵn sàng. Vui lòng thử lại sau.',
            isAi: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const createConversation = async (title = 'Cuộc hội thoại mới') => {
    if (!chatbotEnabled) {
      throw new Error('AI chatbot is disabled');
    }

    const response = await chatbotService.createConversation(title);
    const newConv = response.data?.data || response.data;
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv.id);
    setMessages([]);
    return newConv;
  };

  const renameConversation = async (id, title) => {
    await chatbotService.renameConversation(id, title);
    setConversations((prev) => prev.map((conv) => (conv.id === id ? { ...conv, title } : conv)));
  };

  const deleteConversation = async (id) => {
    await chatbotService.deleteConversation(id);
    setConversations((prev) => {
      const next = prev.filter((conv) => conv.id !== id);
      if (activeConversation === id) {
        setActiveConversation(next.length > 0 ? next[0].id : null);
        setMessages([]);
      }
      return next;
    });
  };

  const clearHistory = async (id) => {
    await chatbotService.clearHistory(id);
    if (activeConversation === id) {
      setMessages([]);
    }
  };

  const uploadFile = async (file) => {
    if (!chatbotEnabled) {
      setMessages((prev) => [
        ...prev,
        {
          id: createClientId(),
          text: 'AI chatbot is currently disabled by admin settings.',
          isAi: true,
        },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await chatbotService.uploadFile(file, activeConversation);
      const payload = response.data?.data || response.data;
      const fileMsg = {
        id: createClientId(),
        text: `Đã tải lên: ${file.name}`,
        isAi: false,
        attachmentUrl: payload.fileData?.url,
        attachmentType: payload.fileData?.type,
      };
      setMessages((prev) => [...prev, fileMsg]);

      const aiMsg = {
        id: createClientId(),
        text: payload.aiResponse,
        isAi: true,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (payload.conversationId && !activeConversation) {
        setActiveConversation(payload.conversationId);
        fetchConversations();
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: createClientId(),
          text: error.response?.data?.message || 'Lỗi khi tải lên file.',
          isAi: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const switchConversation = (id) => {
    setActiveConversation(id);
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !chatbotEnabled) {
      chatSessionUserIdRef.current = null;
      setConversations([]);
      setMessages([]);
      setSuggestedQuestions([]);
      setActiveConversation(null);
      setIsLoading(false);
      return;
    }

    const uid = user?.id ?? null;
    const sessionChanged = chatSessionUserIdRef.current !== uid;
    if (sessionChanged) {
      chatSessionUserIdRef.current = uid;
      setMessages([]);
      setActiveConversation(null);
      setConversations([]);
      setIsLoading(false);
    }

    fetchConversationsRef.current?.();
    fetchSuggestedQuestionsRef.current?.();
  }, [authLoading, isAuthenticated, chatbotEnabled, user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, activeConversation]);

  // Dedicated effect to clear timeout on unmount and dependency changes
  useEffect(() => {
    return () => {
      clearSocketLoadingTimeout();
    };
  }, [clearSocketLoadingTimeout]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        conversations,
        activeConversation,
        isLoading,
        suggestedQuestions,
        chatbotEnabled,
        sendMessage,
        createConversation,
        renameConversation,
        deleteConversation,
        clearHistory,
        uploadFile,
        switchConversation,
        fetchConversations,
        fetchHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

ChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChat = () => useContext(ChatContext) || CHAT_CONTEXT_DEFAULT_VALUE;
