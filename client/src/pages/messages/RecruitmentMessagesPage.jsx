import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Archive,
  ArrowRight,
  Ban,
  Bell,
  Briefcase,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronLeft,
  Download,
  FileText,
  Inbox,
  Info,
  Loader2,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import StatCard from '@/components/common/StatCard';
import { resolveBrowserApiUrl } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import messageService from '../../services/messageService';
import { cn } from '../../utils/cn';
import { formatDate, formatTimeAgo } from '../../utils/formatters';

const MAX_MESSAGE_LENGTH = 4000;
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const HISTORY_PAGE_SIZE = 100;
const POLL_INTERVAL_MS = 45_000;
const ALLOWED_ATTACHMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];

const unwrap = (response) => response?.data?.data || response?.data || {};

const ROLE_COPY = {
  candidate: {
    eyebrow: 'Hộp tin ứng viên',
    title: 'Tin nhắn với nhà tuyển dụng',
    description: 'Trao đổi trong đúng bối cảnh hồ sơ ứng tuyển.',
    emptyTitle: 'Chưa có hội thoại tuyển dụng',
    emptyDescription:
      'Khi bạn mở tin nhắn từ một đơn ứng tuyển hoặc nhà tuyển dụng phản hồi, hội thoại sẽ xuất hiện tại đây.',
    primaryCta: { to: '/candidate/applications', label: 'Xem đơn ứng tuyển' },
    secondaryCta: { to: '/candidate/jobs', label: 'Tìm việc phù hợp' },
    detailOwnerLabel: 'Nhà tuyển dụng',
    ownerHelper: 'Đầu mối phản hồi',
    messagePlaceholder: 'Nhập phản hồi cho nhà tuyển dụng...',
    quickReplies: [
      'Cảm ơn anh/chị đã phản hồi. Em sẵn sàng trao đổi thêm về vị trí này.',
      'Anh/chị có thể cho em xin thêm thông tin về vòng tiếp theo được không ạ?',
      'Em xác nhận đã nhận thông tin và sẽ phản hồi trong thời gian sớm nhất.',
    ],
    listTitle: 'Hộp tin',
    activeTitle: 'Đang trao đổi',
    onlineHelper: 'Kênh phản hồi ứng tuyển',
  },
  recruiter: {
    eyebrow: 'Trao đổi tuyển dụng',
    title: 'Tin nhắn ứng viên',
    description: 'Trao đổi trực tiếp với ứng viên trong cùng bối cảnh hồ sơ.',
    emptyTitle: 'Chưa có hội thoại ứng viên',
    emptyDescription:
      'Mở một hồ sơ ứng tuyển rồi chọn gửi tin nhắn để tạo hội thoại đúng ứng viên, đúng công việc.',
    primaryCta: { to: '/employer/applications', label: 'Mở pipeline ứng viên' },
    secondaryCta: { to: '/employer/jobs', label: 'Quản lý tin tuyển dụng' },
    detailOwnerLabel: 'Ứng viên',
    ownerHelper: 'Người đang ứng tuyển',
    messagePlaceholder: 'Nhập tin nhắn cho ứng viên...',
    quickReplies: [
      'Cảm ơn bạn đã quan tâm vị trí này. Mình muốn trao đổi thêm về kinh nghiệm của bạn.',
      'Bạn có thể xác nhận thời gian phù hợp để tham gia vòng tiếp theo không?',
      'Mình đã ghi nhận thông tin và sẽ cập nhật kết quả sớm nhất.',
    ],
    listTitle: 'Ứng viên',
    activeTitle: 'Đang xử lý',
    onlineHelper: 'Kênh phản hồi ứng viên',
  },
};

const APPLICATION_STATUS_META = {
  pending: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-700 ring-amber-100' },
  submitted: { label: 'Đã nộp', className: 'bg-blue-50 text-blue-700 ring-blue-100' },
  reviewing: { label: 'Đang xem xét', className: 'bg-sky-50 text-sky-700 ring-sky-100' },
  shortlisted: {
    label: 'Qua sơ loại',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  },
  interview: { label: 'Phỏng vấn', className: 'bg-violet-50 text-violet-700 ring-violet-100' },
  offered: { label: 'Đã đề nghị', className: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  hired: { label: 'Đã tuyển', className: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  rejected: { label: 'Từ chối', className: 'bg-rose-50 text-rose-700 ring-rose-100' },
  withdrawn: { label: 'Đã rút', className: 'bg-slate-50 text-slate-700 ring-slate-200' },
  cancelled: { label: 'Đã hủy', className: 'bg-slate-50 text-slate-700 ring-slate-200' },
};

const MESSAGE_STATUS_META = {
  sent: { label: 'Đã gửi', icon: Check, className: 'text-slate-400' },
  delivered: { label: 'Đã nhận', icon: CheckCheck, className: 'text-sky-500' },
  seen: { label: 'Đã xem', icon: CheckCheck, className: 'text-emerald-500' },
};

const JOB_TYPE_LABELS = {
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian',
  contract: 'Hợp đồng',
  internship: 'Thực tập',
  freelance: 'Tự do',
  remote: 'Từ xa',
  hybrid: 'Kết hợp',
};

const MOBILE_PANELS = [
  { id: 'inbox', label: 'Hộp tin', icon: Inbox },
  { id: 'messages', label: 'Trò chuyện', icon: MessageSquare },
  { id: 'context', label: 'Ngữ cảnh', icon: Briefcase },
];

const getConversationName = (conversation, role) => {
  if (!conversation) return '';
  if (role === 'candidate') {
    return conversation.company_name || conversation.recruiter_name || 'Nhà tuyển dụng';
  }
  return conversation.candidate_name || conversation.candidate_email || 'Ứng viên';
};

const getConversationAvatar = (conversation, role) => {
  const name = getConversationName(conversation, role);
  return (name.charAt(0) || '?').toUpperCase();
};

const getCounterpartSubtitle = (conversation, role) => {
  if (!conversation) return '';
  if (role === 'candidate') {
    return (
      conversation.recruiter_name ||
      conversation.recruiter_email ||
      conversation.company_name ||
      'Nhà tuyển dụng'
    );
  }
  return conversation.candidate_email || conversation.candidate_name || 'Ứng viên';
};

const normalizeText = (value) => String(value || '').trim();

const getStatusMeta = (status) => {
  const key = normalizeText(status).toLowerCase();
  return (
    APPLICATION_STATUS_META[key] || {
      label: status || 'Đang xử lý',
      className: 'bg-slate-50 text-slate-700 ring-slate-200',
    }
  );
};

const getMessageStatusMeta = (status) => {
  const key = normalizeText(status || 'sent').toLowerCase();
  return MESSAGE_STATUS_META[key] || MESSAGE_STATUS_META.sent;
};

const formatJobType = (jobType) => {
  const key = normalizeText(jobType).toLowerCase();
  return JOB_TYPE_LABELS[key] || jobType || 'Chưa phân loại';
};

const formatAbsoluteTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatFileSize = (value) => {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getAttachmentMeta = (message) => ({
  url: message?.attachment_url || message?.attachment?.url || '',
  name: message?.attachment_name || message?.attachment?.name || 'Tệp đính kèm',
  mime: message?.attachment_mime || message?.attachment?.mime || '',
  size: message?.attachment_size || message?.attachment?.size || 0,
});

const getAttachmentUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return resolveBrowserApiUrl(url.replace(/^\/api\/?/, ''));
};

const getFileExtension = (name) => {
  const match = String(name || '')
    .toLowerCase()
    .match(/\.[a-z0-9]+$/);
  return match?.[0] || '';
};

const isAllowedAttachment = (file) => {
  const extension = getFileExtension(file?.name);
  return ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension);
};

const getCurrentUserName = (user) =>
  user?.fullName ||
  `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
  user?.email ||
  'Người dùng';

const isSameDate = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  return da.toDateString() === db.toDateString();
};

const SidebarCard = ({ title, icon: Icon, children, className, action }) => (
  <div
    className={cn(
      'rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm shadow-slate-200/70 ring-1 ring-white/70',
      className
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const SkeletonBar = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-slate-100', className)} />
);

const ConversationSkeleton = () => (
  <div className="space-y-2 p-2">
    {[1, 2, 3, 4].map((item) => (
      <div key={item} className="rounded-lg border border-slate-100 bg-white p-3">
        <div className="flex gap-3">
          <SkeletonBar className="h-10 w-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBar className="h-3 w-2/3" />
            <SkeletonBar className="h-3 w-1/2" />
            <SkeletonBar className="h-8 w-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const MessageSkeleton = () => (
  <div className="space-y-4">
    {[0, 1, 2, 3, 4].map((item) => (
      <div key={item} className={cn('flex', item % 2 ? 'justify-end' : 'justify-start')}>
        <div className="w-[72%] max-w-sm space-y-2">
          <SkeletonBar
            className={cn('h-12', item % 2 ? 'ml-auto w-4/5 bg-emerald-100' : 'w-full')}
          />
          <SkeletonBar className={cn('h-3 w-20', item % 2 && 'ml-auto')} />
        </div>
      </div>
    ))}
  </div>
);

const EmptyConversationState = ({ copy, onShowArchived, showArchived = false }) => (
  <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
      <Inbox className="h-7 w-7" />
    </div>
    <h2 className="mt-5 text-xl font-bold text-slate-950">{copy.emptyTitle}</h2>
    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
      {copy.emptyDescription}
    </p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Link
        to={copy.primaryCta.to}
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
      >
        {copy.primaryCta.label}
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        to={copy.secondaryCta.to}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
      >
        {copy.secondaryCta.label}
      </Link>
      {onShowArchived && !showArchived && (
        <button
          type="button"
          onClick={onShowArchived}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
        >
          <Archive className="h-4 w-4" />
          Xem hội thoại đã lưu trữ
        </button>
      )}
    </div>
  </div>
);

const RecruitmentMessagesPage = ({ role = 'candidate' }) => {
  const normalizedRole = role;
  const copy = ROLE_COPY[normalizedRole] || ROLE_COPY.candidate;
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const conversationId = searchParams.get('conversationId');

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationActionLoading, setConversationActionLoading] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [mobilePanel, setMobilePanel] = useState('messages');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExhausted, setHistoryExhausted] = useState(false);
  const [interviewForm, setInterviewForm] = useState({ scheduled_at: '', location: '', note: '' });
  const [jobInfoForm, setJobInfoForm] = useState({ title: '', url: '', note: '' });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const listParams = useMemo(
    () => ({
      limit: 100,
      ...(jobFilter !== 'all' ? { jobId: jobFilter } : {}),
      ...(showArchived ? { archived: true, includeArchived: true } : {}),
    }),
    [jobFilter, showArchived]
  );

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, item) => sum + Number(item.unread_count || 0), 0),
    [conversations]
  );

  const jobOptions = useMemo(() => {
    const map = new Map();
    conversations.forEach((conversation) => {
      const id = conversation.job_id;
      if (id && !map.has(String(id))) {
        map.set(String(id), conversation.job_title || `Công việc #${id}`);
      }
    });
    if (activeConversation?.job_id && !map.has(String(activeConversation.job_id))) {
      map.set(
        String(activeConversation.job_id),
        activeConversation.job_title || `Công việc #${activeConversation.job_id}`
      );
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [activeConversation, conversations]);

  const filteredConversations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const fields = [
        getConversationName(conversation, normalizedRole),
        getCounterpartSubtitle(conversation, normalizedRole),
        conversation.job_title,
        conversation.job_type,
        conversation.company_name,
        conversation.candidate_name,
        conversation.candidate_email,
        conversation.recruiter_name,
        conversation.recruiter_email,
        conversation.last_message_preview,
        conversation.application_status,
      ];
      return fields.some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [conversations, normalizedRole, searchTerm]);

  const activeTodayCount = useMemo(() => {
    const today = new Date();
    return conversations.filter((conversation) => {
      const timestamp =
        conversation.last_message_at || conversation.updated_at || conversation.created_at;
      return isSameDate(timestamp, today);
    }).length;
  }, [conversations]);

  const messageTimeline = useMemo(
    () =>
      messages.map((message, index) => ({
        ...message,
        showDateSeparator:
          index === 0 || !isSameDate(message.created_at, messages[index - 1]?.created_at),
      })),
    [messages]
  );

  const applicationOpenRef = useRef({ key: '', promise: null });

  const refreshConversations = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setListRefreshing(true);
      try {
        const response = await messageService.getConversations(listParams);
        const payload = unwrap(response);
        const items = Array.isArray(payload.conversations) ? payload.conversations : [];
        setConversations(items);
        setLoadError(null);
        return items;
      } catch (error) {
        console.error('Failed to refresh recruitment conversations:', error);
        setLoadError('Không tải được danh sách hội thoại. Vui lòng kiểm tra kết nối và thử lại.');
        if (!silent) setConversations([]);
        return [];
      } finally {
        if (!silent) setListRefreshing(false);
      }
    },
    [listParams]
  );

  const loadConversation = useCallback(
    async (id, { updateUrl = true, silent = false } = {}) => {
      if (!id) return null;
      if (!silent) setMessagesLoading(true);
      try {
        const response = await messageService.getConversation(id, {
          limit: HISTORY_PAGE_SIZE,
          latest: true,
        });
        const payload = unwrap(response);
        const conversation = payload.conversation || null;
        const nextMessages = Array.isArray(payload.messages) ? payload.messages : [];

        setActiveConversation(conversation);
        setMessages(nextMessages);
        setHistoryExhausted(false);
        setLoadError(null);

        if (conversation?.id) {
          messageService.markRead(conversation.id).catch(() => {});
          setConversations((prev) =>
            prev.map((item) =>
              Number(item.id) === Number(conversation.id) ? { ...item, unread_count: 0 } : item
            )
          );
          if (updateUrl) {
            setSearchParams({ conversationId: String(conversation.id) }, { replace: true });
          }
        }

        return conversation;
      } catch (error) {
        console.error('Failed to load conversation:', error);
        if (!silent) {
          setLoadError('Không tải được nội dung hội thoại. Vui lòng thử lại.');
          showNotification('Không tải được hội thoại. Vui lòng thử lại.', 'error');
        }
        return null;
      } finally {
        if (!silent) setMessagesLoading(false);
      }
    },
    [setSearchParams, showNotification]
  );

  const openApplicationConversation = useCallback(
    async (id) => {
      if (!id) return null;
      const key = `${normalizedRole}:${id}`;
      if (applicationOpenRef.current.key === key && applicationOpenRef.current.promise) {
        return applicationOpenRef.current.promise;
      }

      const promise = (async () => {
        setMessagesLoading(true);
        try {
          const response = await messageService.openByApplication(id);
          const payload = unwrap(response);
          const conversation = payload.conversation || null;
          const nextMessages = Array.isArray(payload.messages) ? payload.messages : [];

          setActiveConversation(conversation);
          setMessages(nextMessages);
          setHistoryExhausted(false);
          setLoadError(null);
          if (conversation?.id) {
            setSearchParams({ conversationId: String(conversation.id) }, { replace: true });
          }
          await refreshConversations({ silent: true });
          return conversation;
        } catch (error) {
          const status = error.response?.status;
          console.error('Failed to open application conversation:', error);
          setActiveConversation(null);
          setMessages([]);
          setHistoryExhausted(false);
          setLoadError(
            status === 404
              ? 'Không tìm thấy hồ sơ ứng tuyển hoặc hồ sơ đã bị xóa.'
              : 'Không mở được hội thoại cho hồ sơ ứng tuyển này.'
          );
          if (status !== 404) {
            showNotification('Không mở được hội thoại cho hồ sơ ứng tuyển này.', 'error');
          }
          return null;
        } finally {
          setMessagesLoading(false);
          if (applicationOpenRef.current.key === key) {
            applicationOpenRef.current = { key: '', promise: null };
          }
        }
      })();

      applicationOpenRef.current = { key, promise };
      return promise;
    },
    [normalizedRole, refreshConversations, setSearchParams, showNotification]
  );

  const initialize = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const items = await refreshConversations({ silent: true });
      if (applicationId) {
        const matchedConversation = items.find(
          (item) => Number(item.application_id) === Number(applicationId)
        );
        if (matchedConversation?.id) {
          await loadConversation(matchedConversation.id, { updateUrl: true });
        } else {
          await openApplicationConversation(applicationId);
        }
      } else if (conversationId) {
        await loadConversation(conversationId, { updateUrl: false });
      } else if (items[0]?.id) {
        await loadConversation(items[0].id, { updateUrl: false });
      } else {
        setActiveConversation(null);
        setMessages([]);
        setHistoryExhausted(false);
        setMobilePanel('inbox');
      }
    } catch (error) {
      console.error('Failed to initialize recruitment messages:', error);
      setActiveConversation(null);
      setMessages([]);
      setHistoryExhausted(false);
      setLoadError('Không thể khởi tạo trang tin nhắn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [
    applicationId,
    conversationId,
    loadConversation,
    openApplicationConversation,
    refreshConversations,
  ]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    if (!activeConversation?.id) return undefined;
    const interval = window.setInterval(() => {
      refreshConversations({ silent: true });
      loadConversation(activeConversation.id, { updateUrl: false, silent: true });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [activeConversation?.id, loadConversation, refreshConversations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshConversations();
      if (activeConversation?.id) {
        await loadConversation(activeConversation.id, { updateUrl: false });
      }
      showNotification('Đã làm mới hội thoại.', 'success');
    } finally {
      setRefreshing(false);
    }
  };

  const selectConversation = (conversation) => {
    setMobilePanel('messages');
    setSelectedFile(null);
    setHistoryExhausted(false);
    loadConversation(conversation.id);
  };

  const validateSelectedFile = (file) => {
    if (!file) return false;
    if (!isAllowedAttachment(file)) {
      showNotification('Chỉ hỗ trợ tệp PDF, Word hoặc PowerPoint.', 'error');
      return false;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      showNotification('Tệp đính kèm không được vượt quá 5MB.', 'error');
      return false;
    }
    return true;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!validateSelectedFile(file)) return;
    setSelectedFile(file);
  };

  const removeSelectedFile = () => setSelectedFile(null);

  const sendCurrentMessage = async () => {
    const body = input.trim();
    if ((!body && !selectedFile) || !activeConversation?.id || sending) return;
    if (body.length > MAX_MESSAGE_LENGTH) {
      showNotification(
        `Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH.toLocaleString('vi-VN')} ký tự.`,
        'error'
      );
      return;
    }
    if (selectedFile && !validateSelectedFile(selectedFile)) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const now = new Date().toISOString();
    const optimisticAttachment = selectedFile
      ? {
          name: selectedFile.name,
          mime: selectedFile.type,
          size: selectedFile.size,
        }
      : null;
    const preview = selectedFile ? `📎 ${selectedFile.name}${body ? ` · ${body}` : ''}` : body;
    const optimisticMessage = {
      id: optimisticId,
      conversation_id: activeConversation.id,
      sender_id: user?.id,
      sender_role: normalizedRole,
      body,
      message_type: selectedFile ? 'file' : 'text',
      attachment: optimisticAttachment,
      attachment_name: optimisticAttachment?.name,
      attachment_mime: optimisticAttachment?.mime,
      attachment_size: optimisticAttachment?.size,
      status: 'sent',
      created_at: now,
      sender_name: getCurrentUserName(user),
      sender_email: user?.email,
      _optimistic: true,
    };

    const fileToSend = selectedFile;
    setSending(true);
    setInput('');
    setSelectedFile(null);
    setMessages((prev) => [...prev, optimisticMessage]);
    setActiveConversation((prev) =>
      prev
        ? {
            ...prev,
            last_message_preview: preview,
            last_message_at: now,
            message_count: Number(prev.message_count || 0) + 1,
          }
        : prev
    );
    setConversations((prev) =>
      prev.map((item) =>
        Number(item.id) === Number(activeConversation.id)
          ? {
              ...item,
              last_message_preview: preview,
              last_message_at: now,
              unread_count: 0,
              message_count: Number(item.message_count || 0) + 1,
            }
          : item
      )
    );

    try {
      const response = fileToSend
        ? await messageService.sendAttachment(activeConversation.id, fileToSend, body)
        : await messageService.sendMessage(activeConversation.id, body);
      const message = unwrap(response);
      setMessages((prev) => prev.map((item) => (item.id === optimisticId ? message : item)));
      refreshConversations({ silent: true });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
      setInput(body);
      if (fileToSend) setSelectedFile(fileToSend);
      showNotification(
        error.response?.data?.message || 'Không gửi được tin nhắn. Vui lòng thử lại.',
        'error'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSend = (event) => {
    event.preventDefault();
    sendCurrentMessage();
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendCurrentMessage();
    }
  };

  const applyQuickReply = (template) => {
    setInput((prev) => (prev.trim() ? `${prev.trim()}\n${template}` : template));
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const clearSearch = () => setSearchTerm('');

  const runConversationAction = async ({
    actionKey,
    action,
    successMessage,
    afterDelete = false,
  }) => {
    if (!activeConversation?.id || conversationActionLoading) return;
    setConversationActionLoading(actionKey);
    try {
      await action(activeConversation.id);
      showNotification(successMessage, 'success');
      if (afterDelete) {
        setActiveConversation(null);
        setMessages([]);
        setSearchParams({}, { replace: true });
        setMobilePanel('inbox');
      } else {
        await loadConversation(activeConversation.id, { updateUrl: false, silent: true });
      }
      await refreshConversations({ silent: true });
    } catch (error) {
      console.error(`Failed conversation action ${actionKey}:`, error);
      showNotification(
        error.response?.data?.message || 'Không thể thực hiện thao tác. Vui lòng thử lại.',
        'error'
      );
    } finally {
      setConversationActionLoading('');
    }
  };

  const loadOlderMessages = async () => {
    if (!activeConversation?.id || historyLoading || historyExhausted) return;

    const firstPersistedMessage = messages.find((message) => {
      const messageId = Number(message.id);
      return !message._optimistic && Number.isFinite(messageId) && messageId > 0;
    });

    if (!firstPersistedMessage?.id) {
      setHistoryExhausted(true);
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await messageService.getConversation(activeConversation.id, {
        limit: HISTORY_PAGE_SIZE,
        beforeId: firstPersistedMessage.id,
      });
      const payload = unwrap(response);
      const olderMessages = Array.isArray(payload.messages) ? payload.messages : [];

      if (payload.conversation) {
        setActiveConversation(payload.conversation);
      }

      if (olderMessages.length === 0) {
        setHistoryExhausted(true);
        return;
      }

      setMessages((prev) => {
        const existingIds = new Set(prev.map((item) => String(item.id)));
        const uniqueOlderMessages = olderMessages.filter(
          (item) => !existingIds.has(String(item.id))
        );
        return [...uniqueOlderMessages, ...prev];
      });
    } catch (error) {
      console.error('Failed to load older recruitment messages:', error);
      showNotification('Không tải được lịch sử trò chuyện. Vui lòng thử lại.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const archiveCurrentConversation = () => {
    const archived = !activeConversation?.is_archived;
    return runConversationAction({
      actionKey: 'archive',
      action: (id) => messageService.archiveConversation(id, archived),
      successMessage: archived
        ? 'Đã lưu trữ hội thoại. Bật "Xem hội thoại đã lưu trữ" trong hộp tin để xem lại.'
        : 'Đã khôi phục hội thoại vào hộp tin.',
      afterDelete: true,
    });
  };

  const deleteCurrentConversation = () => {
    if (
      !window.confirm(
        'Xóa hội thoại khỏi hộp tin của bạn? Người còn lại vẫn có thể thấy lịch sử của họ.'
      )
    )
      return;
    runConversationAction({
      actionKey: 'delete',
      action: (id) => messageService.deleteConversation(id),
      successMessage: 'Đã xóa hội thoại khỏi hộp tin của bạn.',
      afterDelete: true,
    });
  };

  const toggleBlockCurrentConversation = () => {
    const blocked = !activeConversation?.blocked_by_viewer;
    runConversationAction({
      actionKey: 'block',
      action: (id) => messageService.blockConversation(id, blocked),
      successMessage: blocked ? 'Đã chặn hội thoại.' : 'Đã bỏ chặn hội thoại.',
    });
  };

  const sendInterviewInvite = async (event) => {
    event.preventDefault();
    if (!interviewForm.scheduled_at) {
      showNotification('Vui lòng chọn thời gian phỏng vấn.', 'error');
      return;
    }
    await runConversationAction({
      actionKey: 'interview',
      action: (id) =>
        messageService.sendInterviewInvite(id, {
          scheduled_at: interviewForm.scheduled_at,
          location: interviewForm.location.trim(),
          note: interviewForm.note.trim(),
        }),
      successMessage: 'Đã gửi lời mời phỏng vấn.',
    });
    setInterviewForm({ scheduled_at: '', location: '', note: '' });
    if (activeConversation?.id)
      await loadConversation(activeConversation.id, { updateUrl: false, silent: true });
  };

  const sendJobInfo = async (event) => {
    event.preventDefault();
    await runConversationAction({
      actionKey: 'job-info',
      action: (id) =>
        messageService.sendJobInfo(id, {
          title: jobInfoForm.title.trim(),
          url: jobInfoForm.url.trim(),
          note: jobInfoForm.note.trim(),
        }),
      successMessage: 'Đã gửi thông tin công việc.',
    });
    setJobInfoForm({ title: '', url: '', note: '' });
    if (activeConversation?.id)
      await loadConversation(activeConversation.id, { updateUrl: false, silent: true });
  };

  const isConversationClosed = activeConversation?.status === 'closed';
  const isConversationBlocked = Boolean(
    activeConversation?.status === 'blocked' ||
    activeConversation?.blocked_by_viewer ||
    activeConversation?.blocked_by_counterpart
  );
  const composerDisabled = isConversationClosed || isConversationBlocked;
  const canSend = Boolean(
    activeConversation?.id &&
    !composerDisabled &&
    (input.trim() || selectedFile) &&
    !sending &&
    input.trim().length <= MAX_MESSAGE_LENGTH
  );
  const totalMessageCount = Number(activeConversation?.message_count || 0);
  const canLoadOlderMessages = Boolean(
    activeConversation?.id &&
    messages.length > 0 &&
    !historyExhausted &&
    totalMessageCount > messages.length
  );
  const hasConversations = conversations.length > 0 || activeConversation;
  const currentStatus = getStatusMeta(activeConversation?.application_status);
  const characterCount = input.trim().length;

  const summaryCards = [
    {
      label: 'Hội thoại',
      value: conversations.length,
      helper: `${filteredConversations.length} đang hiển thị`,
      icon: MessageSquare,
      tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    },
    {
      label: 'Chưa đọc',
      value: unreadTotal,
      helper: unreadTotal > 0 ? 'Cần phản hồi' : 'Đã xử lý',
      icon: Bell,
      tone: 'bg-amber-50 text-amber-600 ring-amber-100',
    },
    {
      label: conversations.length > 0 ? 'Trực tuyến' : 'Sẵn sàng',
      value: conversations.length > 0 ? 'Trực tuyến' : '—',
      helper: `${activeTodayCount} hoạt động hôm nay`,
      icon: ShieldCheck,
      tone: 'bg-sky-50 text-sky-600 ring-sky-100',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent pb-14">
      <div className="relative overflow-hidden border-b border-emerald-100/70 bg-transparent">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-8 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
                <MessageSquare className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  {copy.eyebrow}
                </span>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {copy.title}
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                  {copy.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/80 bg-white/80 p-2 shadow-sm backdrop-blur">
              <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {copy.onlineHelper}
              </span>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                Làm mới
              </button>
            </div>
          </div>

          {!loading && hasConversations && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {summaryCards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </div>
          )}
          {loading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <SkeletonBar key={item} className="h-24 bg-white/80" />
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        {loadError && (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-white px-3 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thử lại
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[480px] items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
              <p className="mt-4 text-sm font-semibold text-slate-600">Đang tải hội thoại...</p>
            </div>
          </div>
        ) : !hasConversations ? (
          <EmptyConversationState
            copy={copy}
            showArchived={showArchived}
            onShowArchived={() => {
              setShowArchived(true);
              setMobilePanel('inbox');
            }}
          />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2 lg:hidden">
              {MOBILE_PANELS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMobilePanel(id)}
                  className={cn(
                    'inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-bold transition',
                    mobilePanel === id
                      ? 'border-emerald-200 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_300px]">
              <aside
                className={cn(
                  'overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/70 ring-1 ring-white/70',
                  mobilePanel !== 'inbox' && 'hidden lg:block'
                )}
              >
                <div className="border-b border-slate-200/80 bg-slate-50/70 p-4 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-950">{copy.listTitle}</h2>
                      <p className="text-xs text-slate-500">
                        {filteredConversations.length}{' '}
                        {showArchived ? 'hội thoại đã lưu trữ' : 'hội thoại'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:text-emerald-700"
                      aria-label="Làm mới"
                    >
                      <RefreshCw
                        className={cn('h-4 w-4', (refreshing || listRefreshing) && 'animate-spin')}
                      />
                    </button>
                  </div>
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Tìm kiếm..."
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-slate-600"
                        aria-label="Xóa tìm kiếm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-2">
                    {normalizedRole === 'recruiter' && (
                      <select
                        value={jobFilter}
                        onChange={(event) => setJobFilter(event.target.value)}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10"
                      >
                        <option value="all">Tất cả vị trí tuyển dụng</option>
                        {jobOptions.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title}
                          </option>
                        ))}
                      </select>
                    )}
                    <label className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-100">
                      <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(event) => setShowArchived(event.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {showArchived ? 'Đang xem hội thoại đã lưu trữ' : 'Xem hội thoại đã lưu trữ'}
                    </label>
                  </div>
                </div>

                <div className="max-h-[680px] overflow-y-auto p-2.5">
                  {listRefreshing ? (
                    <ConversationSkeleton />
                  ) : filteredConversations.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-xs leading-5 text-slate-500">
                      {showArchived
                        ? 'Chưa có hội thoại đã lưu trữ. Khi lưu trữ, hãy bật bộ lọc này để xem lại.'
                        : 'Không có hội thoại phù hợp. Thử tìm theo tên công ty, ứng viên hoặc vị trí tuyển dụng.'}
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const active = Number(activeConversation?.id) === Number(conversation.id);
                      const unread = Number(conversation.unread_count || 0);
                      const status = getStatusMeta(conversation.application_status);
                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() => selectConversation(conversation)}
                          className={cn(
                            'mb-2 w-full rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
                            active
                              ? 'border-emerald-200 bg-emerald-50/90 shadow-sm shadow-emerald-100/70 ring-1 ring-emerald-100'
                              : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm'
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white shadow-sm">
                              {getConversationAvatar(conversation, normalizedRole)}
                              {unread > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-1">
                                <p className="truncate text-sm font-bold text-slate-950">
                                  {getConversationName(conversation, normalizedRole)}
                                </p>
                                {unread > 0 && (
                                  <span className="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    {unread > 99 ? '99+' : unread}
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-[11px] font-semibold text-emerald-700">
                                {conversation.job_title || 'Vị trí tuyển dụng'}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {conversation.last_message_preview || 'Chưa có tin nhắn.'}
                              </p>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span
                                  className={cn(
                                    'rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset',
                                    status.className
                                  )}
                                >
                                  {status.label}
                                </span>
                                <span className="shrink-0 text-[10px] font-medium text-slate-400">
                                  {conversation.last_message_at
                                    ? formatTimeAgo(conversation.last_message_at)
                                    : formatDate(conversation.applied_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              <section
                className={cn(
                  'flex min-h-[700px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/70 ring-1 ring-white/70',
                  mobilePanel !== 'messages' && 'hidden lg:block'
                )}
              >
                {activeConversation ? (
                  <>
                    <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setMobilePanel('inbox')}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 lg:hidden"
                            aria-label="Quay lại hộp tin"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-sm font-bold text-white shadow-lg shadow-emerald-600/20">
                            {getConversationAvatar(activeConversation, normalizedRole)}
                            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate text-base font-black text-slate-950">
                              {getConversationName(activeConversation, normalizedRole)}
                            </h2>
                            <p className="truncate text-xs font-semibold text-slate-500">
                              {activeConversation.job_title || 'Vị trí tuyển dụng'}
                            </p>
                          </div>
                        </div>
                        <div className="hidden items-center gap-2 md:flex">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Bảo mật
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset',
                              currentStatus.className
                            )}
                          >
                            {currentStatus.label}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 ring-1 ring-inset ring-slate-100">
                          <Briefcase className="h-3.5 w-3.5 text-emerald-600" />
                          {activeConversation.job_title || 'Vị trí tuyển dụng'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 ring-1 ring-inset ring-slate-100">
                          <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                          Hội thoại #{activeConversation.id}
                        </span>
                        {activeConversation.is_archived && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-inset ring-amber-100">
                            <Archive className="h-3.5 w-3.5" />
                            Đã lưu trữ
                          </span>
                        )}
                      </div>
                      {isConversationBlocked && (
                        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                          {activeConversation.blocked_by_viewer
                            ? 'Bạn đã chặn hội thoại này. Bỏ chặn để tiếp tục gửi tin.'
                            : 'Hội thoại đang bị chặn bởi người còn lại.'}
                        </div>
                      )}
                    </div>

                    <div className="relative h-[600px] overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-5">
                      {messagesLoading ? (
                        <MessageSkeleton />
                      ) : messageTimeline.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-center">
                          <div className="max-w-md">
                            <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                            <p className="mt-3 text-sm font-semibold text-slate-500">
                              Chưa có tin nhắn. Hãy bắt đầu trao đổi trong đúng bối cảnh hồ sơ.
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                              {copy.quickReplies.slice(0, 2).map((reply) => (
                                <button
                                  key={reply}
                                  type="button"
                                  onClick={() => applyQuickReply(reply)}
                                  className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50"
                                >
                                  {reply.length > 46 ? `${reply.slice(0, 46)}...` : reply}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div className="mx-auto flex max-w-xl items-center justify-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-4 py-2 text-[11px] font-bold text-emerald-700 shadow-sm">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Tin nhắn chỉ hiển thị với đúng người trong hội thoại tuyển dụng này
                          </div>
                          {canLoadOlderMessages && (
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={loadOlderMessages}
                                disabled={historyLoading}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {historyLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3.5 w-3.5" />
                                )}
                                Xem lại lịch sử trò chuyện
                              </button>
                            </div>
                          )}
                          {messageTimeline.map((message, index) => {
                            const isMine = Number(message.sender_id) === Number(user?.id);
                            const isSystem =
                              message.sender_role === 'system' || message.message_type === 'system';
                            const isSpecial = ['interview_invite', 'job_info'].includes(
                              message.message_type
                            );
                            const attachment = getAttachmentMeta(message);
                            const hasAttachment = Boolean(
                              attachment.url ||
                              attachment.name !== 'Tệp đính kèm' ||
                              message.message_type === 'file'
                            );
                            const statusMeta = getMessageStatusMeta(message.status);
                            const StatusIcon = statusMeta.icon;
                            return (
                              <React.Fragment key={`${message.id || 'message'}-${index}`}>
                                {message.showDateSeparator && (
                                  <div className="flex justify-center">
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-400 shadow-sm">
                                      {formatDateKey(message.created_at)}
                                    </span>
                                  </div>
                                )}
                                {isSystem ? (
                                  <div className="flex justify-center">
                                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-xs text-slate-500">
                                      {message.body}
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={cn(
                                      'group flex items-end gap-2',
                                      isMine ? 'justify-end' : 'justify-start'
                                    )}
                                  >
                                    {!isMine && (
                                      <div className="mb-5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-[10px] font-bold text-white shadow-sm sm:flex">
                                        {getConversationAvatar(activeConversation, normalizedRole)}
                                      </div>
                                    )}
                                    <div className="max-w-[84%] sm:max-w-[72%]">
                                      <div
                                        className={cn(
                                          'space-y-2 whitespace-pre-wrap break-words rounded-3xl border px-4 py-3 text-sm leading-6 shadow-sm',
                                          isMine
                                            ? 'rounded-br-md border-emerald-500/20 bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-emerald-900/10'
                                            : 'rounded-bl-md border-slate-200/90 bg-white/95 text-slate-700 shadow-slate-200/70',
                                          isSpecial &&
                                            !isMine &&
                                            'border-emerald-100 bg-emerald-50/90',
                                          isSpecial && isMine && 'from-emerald-700 to-teal-700'
                                        )}
                                      >
                                        {isSpecial && (
                                          <div
                                            className={cn(
                                              'flex items-center gap-2 text-xs font-black uppercase tracking-wide',
                                              isMine ? 'text-emerald-50' : 'text-emerald-700'
                                            )}
                                          >
                                            {message.message_type === 'interview_invite' ? (
                                              <CalendarClock className="h-4 w-4" />
                                            ) : (
                                              <Briefcase className="h-4 w-4" />
                                            )}
                                            {message.message_type === 'interview_invite'
                                              ? 'Lời mời phỏng vấn'
                                              : 'Thông tin công việc'}
                                          </div>
                                        )}
                                        {message.body && <div>{message.body}</div>}
                                        {hasAttachment && (
                                          <a
                                            href={getAttachmentUrl(attachment.url)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={cn(
                                              'flex items-center gap-3 rounded-xl p-3 ring-1 ring-inset transition',
                                              isMine
                                                ? 'bg-white/10 text-white ring-white/20 hover:bg-white/15'
                                                : 'bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100'
                                            )}
                                          >
                                            <span
                                              className={cn(
                                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                                isMine ? 'bg-white/15' : 'bg-white'
                                              )}
                                            >
                                              <FileText className="h-5 w-5" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                              <span className="block truncate text-sm font-bold">
                                                {attachment.name}
                                              </span>
                                              <span
                                                className={cn(
                                                  'text-xs font-semibold',
                                                  isMine ? 'text-emerald-50/80' : 'text-slate-400'
                                                )}
                                              >
                                                {[formatFileSize(attachment.size), attachment.mime]
                                                  .filter(Boolean)
                                                  .join(' · ') || 'Tệp CV/hồ sơ dự án'}
                                              </span>
                                            </span>
                                            {attachment.url && (
                                              <Download className="h-4 w-4 shrink-0" />
                                            )}
                                          </a>
                                        )}
                                      </div>
                                      <div
                                        className={cn(
                                          'mt-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold text-slate-400',
                                          isMine && 'justify-end'
                                        )}
                                      >
                                        <span title={formatAbsoluteTime(message.created_at)}>
                                          {formatTimeAgo(message.created_at) || 'Vừa xong'}
                                        </span>
                                        {message._optimistic ? (
                                          <span className="inline-flex items-center gap-1 text-emerald-500">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Đang gửi
                                          </span>
                                        ) : (
                                          isMine && (
                                            <span
                                              className={cn(
                                                'inline-flex items-center gap-1',
                                                statusMeta.className
                                              )}
                                            >
                                              <StatusIcon className="h-3.5 w-3.5" />{' '}
                                              {statusMeta.label}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    <form
                      onSubmit={handleSend}
                      className="border-t border-slate-200/80 bg-gradient-to-b from-white/95 to-slate-50/95 p-4 shadow-[0_-18px_44px_-30px_rgba(15,23,42,0.45)] backdrop-blur sm:p-5"
                    >
                      {isConversationClosed && (
                        <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 shadow-sm">
                          Hội thoại đã đóng. Bạn vẫn có thể xem lịch sử trao đổi nhưng không nên gửi
                          thêm tin mới.
                        </div>
                      )}
                      {selectedFile && (
                        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-3 text-xs text-emerald-800 shadow-sm shadow-emerald-900/5">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-inset ring-emerald-100">
                            <Paperclip className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-black text-emerald-950">
                              {selectedFile.name}
                            </p>
                            <p className="mt-0.5 font-semibold text-emerald-700/80">
                              {formatFileSize(selectedFile.size)} · Sẽ gửi dưới dạng CV/hồ sơ dự án
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={removeSelectedFile}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-100 transition hover:bg-emerald-100"
                            aria-label="Gỡ tệp"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-sm sm:inline-flex">
                          <Sparkles className="h-3 w-3 text-emerald-300" />
                          Gợi ý
                        </span>
                        {copy.quickReplies.map((reply) => (
                          <button
                            key={reply}
                            type="button"
                            onClick={() => applyQuickReply(reply)}
                            disabled={composerDisabled}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                          >
                            {reply.length > 52 ? `${reply.slice(0, 52)}...` : reply}
                          </button>
                        ))}
                      </div>
                      <div
                        className={cn(
                          'rounded-[1.35rem] border bg-white p-2 shadow-lg shadow-slate-900/5 transition focus-within:-translate-y-0.5 focus-within:shadow-xl focus-within:shadow-emerald-900/10',
                          characterCount > MAX_MESSAGE_LENGTH
                            ? 'border-rose-300 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-500/10'
                            : 'border-slate-200 focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-500/10'
                        )}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(event) => setInput(event.target.value)}
                          onKeyDown={handleComposerKeyDown}
                          placeholder={copy.messagePlaceholder}
                          rows={3}
                          disabled={composerDisabled}
                          className="max-h-40 min-h-[92px] w-full resize-none rounded-2xl border-0 bg-transparent px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <div className="mt-1 flex flex-col gap-3 border-t border-slate-100 px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-200">
                              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                              Enter gửi · Shift + Enter xuống dòng
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-inset ring-slate-200">
                              <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                              Tệp tối đa 5MB
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                            <span
                              className={cn(
                                'min-w-[76px] text-right text-[11px] font-black text-slate-400',
                                characterCount > MAX_MESSAGE_LENGTH && 'text-rose-600'
                              )}
                            >
                              {characterCount.toLocaleString('vi-VN')}/
                              {MAX_MESSAGE_LENGTH.toLocaleString('vi-VN')}
                            </span>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={composerDisabled || sending}
                              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Đính kèm CV hoặc hồ sơ dự án"
                            >
                              <Paperclip className="h-4 w-4" />
                              <span className="hidden md:inline">Đính kèm</span>
                            </button>
                            <button
                              type="submit"
                              disabled={!canSend}
                              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-700/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
                              aria-label="Gửi tin nhắn"
                            >
                              {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                              <span className="hidden sm:inline">
                                {sending ? 'Đang gửi' : 'Gửi'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex min-h-[700px] items-center justify-center bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.10),transparent_42%)] p-8 text-center">
                    <div>
                      <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
                      <h2 className="mt-4 text-base font-bold text-slate-950">
                        Chọn một hội thoại
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Chọn hội thoại bên trái để xem tin nhắn và ngữ cảnh hồ sơ.
                      </p>
                      <button
                        type="button"
                        onClick={() => setMobilePanel('inbox')}
                        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white lg:hidden"
                      >
                        Mở hộp tin
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <aside className={cn('space-y-4', mobilePanel !== 'context' && 'hidden lg:block')}>
                <SidebarCard
                  title="Ngữ cảnh hồ sơ"
                  icon={Briefcase}
                  action={
                    activeConversation ? (
                      <span
                        className={cn(
                          'rounded-md px-2 py-1 text-[10px] font-bold ring-1 ring-inset',
                          currentStatus.className
                        )}
                      >
                        {currentStatus.label}
                      </span>
                    ) : null
                  }
                >
                  {activeConversation ? (
                    <div className="mt-3 space-y-2">
                      {[
                        {
                          label: 'Công việc',
                          value: activeConversation.job_title || 'Đang cập nhật',
                          helper: formatJobType(activeConversation.job_type),
                        },
                        {
                          label: copy.detailOwnerLabel,
                          value: getConversationName(activeConversation, normalizedRole),
                          helper: copy.ownerHelper,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-900">{item.value}</p>
                          {item.helper && (
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                              {item.helper}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Chưa chọn hội thoại để hiển thị ngữ cảnh.
                    </p>
                  )}
                </SidebarCard>

                <SidebarCard title="Thao tác hội thoại" icon={ShieldCheck}>
                  {activeConversation ? (
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        onClick={archiveCurrentConversation}
                        disabled={Boolean(conversationActionLoading)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {conversationActionLoading === 'archive' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Archive className="h-3.5 w-3.5" />
                        )}
                        {activeConversation.is_archived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
                      </button>
                      <button
                        type="button"
                        onClick={toggleBlockCurrentConversation}
                        disabled={Boolean(conversationActionLoading)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {conversationActionLoading === 'block' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
                        )}
                        {activeConversation.blocked_by_viewer ? 'Bỏ chặn' : 'Chặn'}
                      </button>
                      <button
                        type="button"
                        onClick={deleteCurrentConversation}
                        disabled={Boolean(conversationActionLoading)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {conversationActionLoading === 'delete' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Xóa khỏi hộp tin
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Chọn hội thoại để thao tác.
                    </p>
                  )}
                </SidebarCard>

                {normalizedRole === 'recruiter' && activeConversation && (
                  <SidebarCard title="Công cụ nhà tuyển dụng" icon={CalendarClock}>
                    <div className="mt-3 space-y-3">
                      <form
                        onSubmit={sendInterviewInvite}
                        className="rounded-lg bg-emerald-50 p-3 ring-1 ring-inset ring-emerald-100"
                      >
                        <p className="text-xs font-black text-emerald-800">Gửi lời mời phỏng vấn</p>
                        <input
                          type="datetime-local"
                          value={interviewForm.scheduled_at}
                          onChange={(event) =>
                            setInterviewForm((prev) => ({
                              ...prev,
                              scheduled_at: event.target.value,
                            }))
                          }
                          className="mt-2 h-9 w-full rounded-md border border-emerald-100 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-300"
                        />
                        <input
                          value={interviewForm.location}
                          onChange={(event) =>
                            setInterviewForm((prev) => ({ ...prev, location: event.target.value }))
                          }
                          placeholder="Địa điểm/link phỏng vấn"
                          className="mt-2 h-9 w-full rounded-md border border-emerald-100 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-300"
                        />
                        <textarea
                          value={interviewForm.note}
                          onChange={(event) =>
                            setInterviewForm((prev) => ({ ...prev, note: event.target.value }))
                          }
                          rows={2}
                          placeholder="Ghi chú thêm"
                          className="mt-2 w-full resize-none rounded-md border border-emerald-100 bg-white px-2 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-300"
                        />
                        <button
                          type="submit"
                          disabled={conversationActionLoading === 'interview' || composerDisabled}
                          className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {conversationActionLoading === 'interview' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          Gửi lời mời
                        </button>
                      </form>

                      <form
                        onSubmit={sendJobInfo}
                        className="rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100"
                      >
                        <p className="text-xs font-black text-slate-800">Gửi thông tin công việc</p>
                        <input
                          value={jobInfoForm.title}
                          onChange={(event) =>
                            setJobInfoForm((prev) => ({ ...prev, title: event.target.value }))
                          }
                          placeholder={activeConversation.job_title || 'Tên vị trí'}
                          className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-300"
                        />
                        <input
                          value={jobInfoForm.url}
                          onChange={(event) =>
                            setJobInfoForm((prev) => ({ ...prev, url: event.target.value }))
                          }
                          placeholder="Link mô tả công việc"
                          className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-300"
                        />
                        <textarea
                          value={jobInfoForm.note}
                          onChange={(event) =>
                            setJobInfoForm((prev) => ({ ...prev, note: event.target.value }))
                          }
                          rows={2}
                          placeholder="Điểm cần lưu ý"
                          className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-300"
                        />
                        <button
                          type="submit"
                          disabled={conversationActionLoading === 'job-info' || composerDisabled}
                          className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-slate-900 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {conversationActionLoading === 'job-info' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Info className="h-3.5 w-3.5" />
                          )}
                          Gửi thông tin
                        </button>
                      </form>
                    </div>
                  </SidebarCard>
                )}

                {activeConversation && (
                  <SidebarCard title="Người dùng hiện tại" icon={UserRound}>
                    <div className="mt-3 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                        {getCurrentUserName(user).charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {getCurrentUserName(user)}
                        </p>
                        <p className="truncate text-xs text-slate-500">{user?.email}</p>
                        <p className="mt-1 inline-flex rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 ring-1 ring-inset ring-slate-100">
                          {normalizedRole}
                        </p>
                      </div>
                    </div>
                  </SidebarCard>
                )}
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  tone: PropTypes.string,
};

SidebarCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  action: PropTypes.node,
};

SkeletonBar.propTypes = {
  className: PropTypes.string,
};

EmptyConversationState.propTypes = {
  onShowArchived: PropTypes.func,
  showArchived: PropTypes.bool,
  copy: PropTypes.shape({
    emptyTitle: PropTypes.string.isRequired,
    emptyDescription: PropTypes.string.isRequired,
    primaryCta: PropTypes.shape({
      to: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }).isRequired,
    secondaryCta: PropTypes.shape({
      to: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

RecruitmentMessagesPage.propTypes = {
  role: PropTypes.oneOf(['candidate', 'recruiter']),
};

export default RecruitmentMessagesPage;
