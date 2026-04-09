import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarPlus,
  CheckCheck,
  Eye,
  FileText,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Star,
  Video,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// ─── Mock data ────────────────────────────────────
const INITIAL_CONVERSATIONS = [
  {
    id: 1,
    name: 'Nguyễn Văn An',
    role: 'UI Designer',
    tag: 'Vòng Phỏng vấn',
    lastMessage: '"Đa em đã nhận được thư mời, em cảm ơn..."',
    time: 'Vừa xong',
    unread: 0,
    online: true,
    initial: 'A',
    gradient: 'from-emerald-600 to-teal-800',
    appliedPosition: 'UI Designer',
    experience: '3 năm',
    salaryExpected: '25M - 35M',
    status: 'Đang xét duyệt',
    notes:
      'Ứng viên có portfolio rất đẹp, tập trung vào mảng Mobile App. Đã từng làm qua 2 công ty lớn về Fintech.',
    sharedFiles: [
      { name: 'CV_NguyenVanAn.pdf', size: '14 tháng 5, 2026', icon: 'pdf' },
      { name: 'Behance_Portfolio_An', size: '14 tháng 5, 2026', icon: 'link' },
    ],
  },
  {
    id: 2,
    name: 'Trần Thị Mai',
    role: 'Frontend Dev',
    tag: 'Frontend Dev',
    lastMessage: 'Em gửi CV cập nhật a. Anh xem qua giúp...',
    time: '10:30',
    unread: 2,
    online: false,
    initial: 'M',
    gradient: 'from-pink-600 to-rose-800',
    appliedPosition: 'Frontend Developer',
    experience: '4 năm',
    salaryExpected: '30M - 40M',
    status: 'Đang trao đổi',
    notes: '',
    sharedFiles: [],
  },
  {
    id: 3,
    name: 'Lê Duy',
    role: 'Marketing',
    tag: 'Marketing',
    lastMessage: 'Chào anh, buổi phỏng vấn chiều nay vẫn...',
    time: 'Hôm qua',
    unread: 0,
    online: true,
    initial: 'D',
    gradient: 'from-amber-600 to-orange-800',
    appliedPosition: 'Marketing Manager',
    experience: '5 năm',
    salaryExpected: '20M - 30M',
    status: 'Chờ phỏng vấn',
    notes: '',
    sharedFiles: [],
  },
  {
    id: 4,
    name: 'Phạm Hoàng Long',
    role: 'Product Owner',
    tag: 'Product Owner',
    lastMessage: 'Cảm ơn quý công ty đã tạo điều kiện...',
    time: '2 ngày trước',
    unread: 0,
    online: false,
    initial: 'L',
    gradient: 'from-blue-600 to-blue-900',
    appliedPosition: 'Product Owner',
    experience: '7 năm',
    salaryExpected: '50M - 70M',
    status: 'Đã nhận offer',
    notes: '',
    sharedFiles: [],
  },
];

const INITIAL_MESSAGES = {
  1: [
    {
      id: 1,
      sender: 'them',
      text: 'Chào anh ạ, em đã gửi CV ứng tuyển vị trí UI Designer qua hệ thống rồi ạ. Không biết anh đã nhận được chưa ạ?',
      time: '09:15',
    },
    {
      id: 2,
      sender: 'me',
      text: 'Chào An, anh đã nhận được CV của em. Hồ sơ của em khá ấn tượng với các dự án Fintech. Anh muốn trao đổi thêm một chút về quy trình làm việc của em.',
      time: '09:42',
      file: { name: 'JD_UI_Designer_V2.pdf', size: '1.2 MB • PDF' },
    },
    {
      id: 3,
      sender: 'them',
      text: 'Dạ em đã nhận được thư mời, em cảm ơn anh. Em rất sẵn lòng trao đổi thêm ạ!',
      time: 'Vừa xong',
    },
  ],
  2: [
    {
      id: 1,
      sender: 'them',
      text: 'Em gửi CV cập nhật a. Anh xem qua giúp em nhé!',
      time: '10:30',
    },
  ],
  3: [
    {
      id: 1,
      sender: 'them',
      text: 'Chào anh, buổi phỏng vấn chiều nay vẫn diễn ra chứ ạ?',
      time: 'Hôm qua',
    },
  ],
  4: [
    {
      id: 1,
      sender: 'them',
      text: 'Cảm ơn quý công ty đã tạo điều kiện cho em phỏng vấn. Em sẽ xem xét offer và phản hồi sớm.',
      time: '2 ngày trước',
    },
  ],
};

function RecruiterNotes({ initialNotes, onPersist }) {
  const [editingNotes, setEditingNotes] = useState(initialNotes);
  const save = () => onPersist(editingNotes);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-base font-black uppercase tracking-widest text-slate-400 mb-3">
        GHI CHÚ TUYỂN DỤNG
      </p>
      <textarea
        value={editingNotes}
        onChange={(e) => setEditingNotes(e.target.value)}
        onBlur={save}
        rows={4}
        placeholder="Ghi chú về ứng viên..."
        className="w-full resize-none bg-slate-50/50 rounded-xl border border-slate-100 p-3 text-base text-slate-700 placeholder:text-slate-300 outline-none leading-relaxed focus:border-emerald-200 transition-all"
      />
      <button
        type="button"
        onClick={save}
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-base font-bold text-slate-500 hover:text-foreground hover:bg-muted/35 transition-colors duration-200 ease-out"
      >
        + THÊM GHI CHÚ
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────
const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const [activeChatId, setActiveChatId] = useState(() => {
    const nameParam = searchParams.get('candidateName');
    if (nameParam) {
      const match = INITIAL_CONVERSATIONS.find(
        (c) => c.name.toLowerCase() === nameParam.toLowerCase()
      );
      return match?.id || 1;
    }
    return 1;
  });
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [searchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'priority'
  const messagesEndRef = useRef(null);

  const activeConversation = conversations.find((c) => c.id === activeChatId) || conversations[0];
  const activeMessages = useMemo(() => messages[activeChatId] || [], [messages, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, activeChatId]);

  const filteredConversations = useMemo(() => {
    let result = conversations;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)
      );
    }
    if (activeTab === 'unread') result = result.filter((c) => c.unread > 0);
    if (activeTab === 'priority') result = result.filter((c) => c.isStarred);
    return result;
  }, [conversations, searchTerm, activeTab]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = {
      id: Date.now(),
      sender: 'me',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), msg] }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId ? { ...c, lastMessage: msg.text, time: 'Vừa xong' } : c
      )
    );
    setInput('');
  };

  const persistNotes = (notes) => {
    setConversations((prev) => prev.map((c) => (c.id === activeChatId ? { ...c, notes } : c)));
  };

  const statusColor = (status) => {
    if (status?.includes('duyệt') || status?.includes('xét'))
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (status?.includes('offer'))
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  };

  return (
    <div
      className="h-[calc(100vh-100px)] min-h-[600px] grid grid-cols-[320px_1fr_320px] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      style={{ maxHeight: '820px' }}
    >
      {/* ── Left: Conversation list ── */}
      <aside className="flex flex-col border-r border-slate-100 bg-slate-50/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tin nhắn</h2>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-foreground hover:bg-muted/55 transition-colors duration-200 ease-out">
              <Search size={16} />
            </button>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-foreground hover:bg-muted/55 transition-colors duration-200 ease-out">
              <MessageSquare size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-3">
          {[
            { k: 'all', l: 'Tất cả' },
            { k: 'unread', l: 'Chưa đọc' },
            { k: 'priority', l: 'Ưu tiên' },
          ].map(({ k, l }) => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              className={`flex-1 rounded-xl py-2 text-base font-bold transition-colors duration-200 ease-out ${
                activeTab === k
                  ? 'bg-primary/10 text-emerald-600 border border-primary/20 shadow-sm'
                  : 'text-slate-500 hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {filteredConversations.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`flex w-full items-start gap-3 px-4 py-4 text-left rounded-xl mb-1 transition-colors duration-200 ease-out ${
                activeChatId === chat.id
                  ? 'bg-card border border-border shadow-sm'
                  : 'border border-transparent hover:bg-muted/35'
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${chat.gradient} text-white font-bold text-base shadow-sm`}
                >
                  {chat.initial}
                </div>
                {chat.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-bold text-slate-900 truncate">{chat.name}</p>
                  <span className="text-base font-medium text-slate-400 shrink-0">{chat.time}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-base font-bold text-emerald-600 border border-emerald-100">
                    {chat.tag}
                  </span>
                  {chat.unread > 0 && (
                    <span className="ml-auto h-5 w-5 rounded-full bg-emerald-600 text-base font-black text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <p className="text-base text-slate-500 truncate mt-1">{chat.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Center: Chat area ── */}
      <section className="flex flex-col overflow-hidden bg-white">
        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${activeConversation.gradient} flex items-center justify-center text-white font-bold text-lg shadow-md`}
              >
                {activeConversation.initial}
              </div>
              {activeConversation.online && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">{activeConversation.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className={`h-2 w-2 rounded-full ${activeConversation.online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`}
                />
                <p className="text-base text-slate-500 font-medium">
                  {activeConversation.online ? 'Đang trực tuyến' : 'Ngoại tuyến'} • Ứng tuyển{' '}
                  {activeConversation.appliedPosition}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-base font-bold text-slate-700 hover:bg-card hover:shadow-sm transition-colors duration-200 ease-out">
              <Eye size={14} className="text-slate-400" />
              HỒ SƠ
            </button>
            <div className="h-6 w-px bg-slate-100 mx-1" />
            <button className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-primary/10 transition-colors duration-200 ease-out border border-transparent hover:border-emerald-100">
              <Phone size={18} />
            </button>
            <button className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-primary/10 transition-colors duration-200 ease-out border border-transparent hover:border-emerald-100">
              <Video size={18} />
            </button>
            <button className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-foreground hover:bg-muted/55 transition-colors duration-200 ease-out border border-transparent hover:border-border">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-slate-50/30">
          <div className="flex justify-center">
            <span className="rounded-full bg-white border border-slate-200 px-5 py-1.5 text-base font-bold text-slate-400 uppercase tracking-widest shadow-sm">
              HÔM NAY
            </span>
          </div>
          {activeMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} group`}
            >
              <div
                className={`max-w-[70%] ${msg.sender === 'me' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}
              >
                {msg.file && (
                  <div
                    className={`rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center gap-4 shadow-sm ${msg.sender === 'me' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 border border-red-100 shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-slate-900 truncate">{msg.file.name}</p>
                      <p className="text-base font-medium text-slate-400 uppercase tracking-tight">
                        {msg.file.size}
                      </p>
                    </div>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-5 py-3.5 text-base leading-relaxed shadow-sm ${
                    msg.sender === 'me'
                      ? 'rounded-br-sm bg-emerald-600 text-white font-medium'
                      : 'rounded-bl-sm bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
                <div className="flex items-center gap-1.5 px-1 text-base font-bold text-slate-400 uppercase">
                  <span>{msg.time}</span>
                  {msg.sender === 'me' && <CheckCheck size={12} className="text-emerald-500" />}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2.5 px-6 py-3 border-t border-slate-100 bg-white">
          {[
            { label: 'Mời phỏng vấn', icon: CalendarPlus },
            { label: 'Gửi tài liệu', icon: FileText },
            { label: 'Giao bài Test', icon: CheckCheck },
            { label: 'Yêu cầu đánh giá', icon: Star },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-base font-bold text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-primary/10 transition-colors duration-200 ease-out shadow-sm group"
            >
              <Icon
                size={12}
                className="text-slate-400 group-hover:text-emerald-500 transition-colors"
              />
              {label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-4">
            <button
              type="button"
              className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-primary/10 transition-colors duration-200 ease-out border border-transparent"
            >
              <Paperclip size={20} />
            </button>
            <div className="flex-1 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn của bạn..."
                className="flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 py-1"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:scale-100 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </section>

      {/* ── Right: Candidate info panel ── */}
      <aside className="flex flex-col border-l border-slate-100 bg-slate-50/30 overflow-y-auto">
        <div className="p-6">
          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className={`h-24 w-24 rounded-3xl bg-gradient-to-br ${activeConversation.gradient} flex items-center justify-center text-white text-4xl font-black mb-5 shadow-xl`}
            >
              {activeConversation.initial}
            </div>
            <p className="font-extrabold text-slate-900 text-xl tracking-tight leading-tight">
              {activeConversation.name}
            </p>
            <p className="text-base font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-0.5 mt-2 uppercase tracking-wide">
              {activeConversation.appliedPosition}
            </p>
            <div className="flex items-center gap-2.5 mt-6 w-full">
              <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-base font-bold text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                KẾT NỐI
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-amber-500 hover:border-amber-200 transition-all shadow-sm">
                <Star size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {/* Recruitment info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-base font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-50 pb-2">
                THÔNG TIN TUYỂN DỤNG
              </p>
              <div className="space-y-4">
                {[
                  {
                    label: 'Kinh nghiệm:',
                    value: activeConversation.experience,
                    valueClass: 'text-slate-900 font-bold',
                  },
                  {
                    label: 'Lương mong muốn:',
                    value: activeConversation.salaryExpected,
                    valueClass: 'text-emerald-600 font-black',
                  },
                  {
                    label: 'Trạng thái:',
                    value: activeConversation.status,
                    valueClass: `inline-block rounded-lg px-2 py-1 text-base font-black uppercase tracking-tight ${statusColor(activeConversation.status)}`,
                  },
                ].map(({ label, value, valueClass }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-base font-bold text-slate-400 uppercase tracking-tighter">
                      {label}
                    </span>
                    <span className={`text-base ${valueClass}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <RecruiterNotes
              key={activeChatId}
              initialNotes={activeConversation?.notes || ''}
              onPersist={persistNotes}
            />

            {/* Shared files */}
            {activeConversation.sharedFiles?.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-base font-black uppercase tracking-widest text-slate-400 mb-4 px-1">
                  FILE ĐÃ CHIA SẺ ({activeConversation.sharedFiles.length})
                </p>
                <div className="space-y-3">
                  {activeConversation.sharedFiles.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/35 transition-colors duration-200 ease-out cursor-pointer border border-transparent hover:border-border"
                    >
                      <div
                        className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-xl ${file.icon === 'pdf' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}
                      >
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-slate-900 truncate pr-2">
                          {file.name}
                        </p>
                        <p className="text-base font-medium text-slate-400 uppercase">
                          {file.size}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default MessagesPage;
