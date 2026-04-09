import PropTypes from 'prop-types';
import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import chatbotService from '../services/chatbotService';
import { useAuth } from './AuthContext';
import { useFeatureFlags } from './FeatureFlagsContext';
import { API_ORIGIN } from '../config';
import { createClientId } from '../utils/clientId';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const chatbotEnabled = isEnabled('ai_chatbot');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const socketRef = useRef(null);
  /** Tránh hiện tin nhắn / hội thoại của phiên trước khi đổi user hoặc sau logout → login. */
  const chatSessionUserIdRef = useRef(null);
  const fetchConversationsRef = useRef(null);
  const fetchSuggestedQuestionsRef = useRef(null);
  /** Tránh kẹt loading khi emit socket mà server không trả chat:response / chat:error */
  const socketLoadingTimeoutRef = useRef(null);

  const clearSocketLoadingTimeout = useCallback(() => {
    if (socketLoadingTimeoutRef.current) {
      clearTimeout(socketLoadingTimeoutRef.current);
      socketLoadingTimeoutRef.current = null;
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!chatbotEnabled) {
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
      console.error('Failed to fetch conversations:', error);
    }
  }, [activeConversation, chatbotEnabled]);

  const fetchHistory = useCallback(async () => {
    if (!activeConversation || !chatbotEnabled) return;

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
      console.error('Failed to fetch chat history:', error);
    }
  }, [activeConversation, chatbotEnabled]);

  const fetchSuggestedQuestions = useCallback(async () => {
    if (!chatbotEnabled) {
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
      console.error('Failed to fetch suggested questions:', error);
    }
  }, [chatbotEnabled]);

  fetchConversationsRef.current = fetchConversations;
  fetchSuggestedQuestionsRef.current = fetchSuggestedQuestions;

  useEffect(() => {
    if (!isAuthenticated || !chatbotEnabled) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return undefined;
    }

    const token = localStorage.getItem('token');
    let cancelled = false;

    (async () => {
      try {
        const { io } = await import('socket.io-client');
        if (cancelled) return;

        const socket = io(API_ORIGIN, {
          auth: { token },
          path: '/socket.io',
          reconnectionAttempts: 3,
        });

        if (cancelled) {
          socket.disconnect();
          return;
        }

        socketRef.current = socket;

        socket.on('chat:response', (data) => {
          clearSocketLoadingTimeout();
          const aiMsg = {
            id: createClientId(),
            text: data?.message,
            isAi: true,
            createdAt: data?.timestamp,
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsLoading(false);
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

        socket.on('chat:error', (error) => {
          clearSocketLoadingTimeout();
          console.error('Socket error:', error);
          setIsLoading(false);
          const text =
            (typeof error?.message === 'string' && error.message.trim()) ||
            'AI chatbot is unavailable right now.';
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
  }, [chatbotEnabled, isAuthenticated, clearSocketLoadingTimeout]);

  const sendMessage = async (text) => {
    if (!isAuthenticated) {
      return;
    }
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

    const userMsg = { id: createClientId(), text, isAi: false };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (socketRef.current && socketRef.current.connected) {
      clearSocketLoadingTimeout();
      socketLoadingTimeoutRef.current = setTimeout(() => {
        socketLoadingTimeoutRef.current = null;
        setIsLoading(false);
      }, 120_000);
      socketRef.current.emit('chat:message', {
        message: text,
        conversationId: activeConversation,
      });
    } else {
      try {
        const response = await chatbotService.sendMessage(text, activeConversation);
        const aiMsg = {
          id: createClientId(),
          text:
            response.data?.data?.message ||
            response.data?.message ||
            'AI chatbot is unavailable right now.',
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
            text: error.response?.data?.message || 'AI chatbot is unavailable right now.',
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
  }, [isAuthenticated, chatbotEnabled, user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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
export const useChat = () => useContext(ChatContext);
