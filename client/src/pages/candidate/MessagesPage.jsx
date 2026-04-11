import React, { useState } from 'react';
import { Search, Phone, Video, MoreVertical, Send, Paperclip, Smile, Image } from 'lucide-react';
import Layout from '../../layouts/Layout';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';

const MESSAGE_MODULES = [
  {
    title: 'Liên lạc nhà tuyển dụng',
    description:
      'Theo dõi các trao đổi liên quan đến phỏng vấn, feedback và offer trong một khu vực riêng.',
  },
  {
    title: 'Ngữ cảnh ứng tuyển',
    description:
      'Mỗi hội thoại có thể gắn với công ty, tin tuyển dụng và lịch hẹn để dễ mở rộng quy trình sau này.',
  },
  {
    title: 'Ưu tiên phản hồi',
    description: 'Nhìn nhanh thread chưa đọc, employer đang online và các tin nhắn cần xử lý ngay.',
  },
];

const INITIAL_CHATS = [
  {
    id: 0,
    name: 'TechHub Solutions',
    role: 'Employer',
    lastMsg: 'Chào bạn, chúng tôi đã nhận được CV...',
    time: '12:45 PM',
    unread: 2,
    online: true,
  },
  {
    id: 1,
    name: 'FPT Software',
    role: 'Employer',
    lastMsg: 'Bạn có thể phỏng vấn vào sáng mai không?',
    time: 'Hôm qua',
    unread: 0,
    online: false,
  },
  {
    id: 2,
    name: 'VNG Corp',
    role: 'Employer',
    lastMsg: 'Cảm ơn bạn đã quan tâm đến vị trí...',
    time: '2 ngày trước',
    unread: 0,
    online: true,
  },
];

const MessagesPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(0);

  // Simulate initial loading (replace with actual API call if needed)
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Layout useSidebar={true}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loading size="lg" text="Đang tải tin nhắn..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout useSidebar={true}>
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-3">
          {MESSAGE_MODULES.map((module) => (
            <div
              key={module.title}
              className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
            >
              <p className="text-base font-black uppercase tracking-[0.22em] text-slate-400">
                Message workspace
              </p>
              <h1 className="mt-3 text-xl font-black text-slate-950">{module.title}</h1>
              <p className="mt-2 text-base leading-6 text-slate-600">{module.description}</p>
            </div>
          ))}
        </div>

        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row bg-white rounded-[40px] shadow-2xl shadow-primary-900/10 border border-slate-100 overflow-hidden">
          {/* Sidebar: Chat List */}
          <aside className="w-full md:w-80 lg:w-96 border-r border-slate-50 flex flex-col">
            <div className="p-8">
              <h1 className="text-2xl font-black text-slate-900 mb-6">Tin nhắn</h1>
              <div className="relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm hội thoại..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-card focus:border-primary-500 outline-none font-medium transition-colors duration-200 ease-out"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
              {INITIAL_CHATS.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-colors duration-200 ease-out ${
                    activeChat === chat.id
                      ? 'bg-primary/10 text-primary-600'
                      : 'hover:bg-muted/35 text-slate-500'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar name={chat.name} size="md" className="rounded-2xl" />
                    {chat.online && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-grow text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className={`font-black truncate max-w-[120px] ${activeChat === chat.id ? 'text-primary-600' : 'text-slate-900'}`}
                      >
                        {chat.name}
                      </p>
                      <span className="text-base font-bold text-slate-400 uppercase tracking-tighter">
                        {chat.time}
                      </span>
                    </div>
                    <p
                      className={`text-base font-medium truncate max-w-[160px] ${activeChat === chat.id ? 'text-primary-400' : 'text-slate-400'}`}
                    >
                      {chat.lastMsg}
                    </p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="w-5 h-5 bg-primary-600 text-white rounded-lg flex items-center justify-center text-base font-black">
                      {chat.unread}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Main: Chat View */}
          <div className="flex-grow flex flex-col bg-slate-50/30">
            {/* Chat Header */}
            <header className="px-8 py-5 bg-white border-b border-slate-50 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <Avatar name={INITIAL_CHATS[activeChat].name} size="md" className="rounded-2xl" />
                <div>
                  <h2 className="font-black text-slate-900 leading-tight">
                    {INITIAL_CHATS[activeChat].name}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${INITIAL_CHATS[activeChat].online ? 'bg-green-500' : 'bg-slate-300'}`}
                    ></div>
                    <span className="text-base font-bold text-slate-400 uppercase tracking-widest">
                      {INITIAL_CHATS[activeChat].online ? 'Đang hoạt động' : 'Ngoại tuyến'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2.5 rounded-xl hover:bg-muted/35 text-slate-400 transition-colors duration-200 ease-out">
                  <Phone size={20} />
                </button>
                <button className="p-2.5 rounded-xl hover:bg-muted/35 text-slate-400 transition-colors duration-200 ease-out">
                  <Video size={20} />
                </button>
                <button className="p-2.5 rounded-xl hover:bg-muted/35 text-slate-400 transition-colors duration-200 ease-out">
                  <MoreVertical size={20} />
                </button>
              </div>
            </header>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="flex justify-center mb-10">
                <Badge variant="gray" className="text-base font-black px-6">
                  HÔM NAY, 12:30 PM
                </Badge>
              </div>

              {/* Sample Messages */}
              <div className="flex justify-start gap-4 max-w-[80%]">
                <Avatar
                  name={INITIAL_CHATS[activeChat].name}
                  size="sm"
                  className="rounded-xl shrink-0"
                />
                <div className="p-5 bg-white rounded-[24px] rounded-tl-none border border-slate-100 shadow-sm text-base font-medium text-slate-700 leading-relaxed">
                  Chào bạn, sau khi xem xét hồ sơ, chúng tôi thấy bạn rất tiềm năng cho vị trí
                  Senior Frontend. Bạn có thể dành chút thời gian phỏng vấn ngắn qua Video Call
                  không?
                </div>
              </div>

              <div className="flex justify-end gap-4 ml-auto max-w-[80%]">
                <div className="p-5 bg-primary-600 rounded-[24px] rounded-tr-none text-white shadow-lg shadow-primary-100 text-base font-medium leading-relaxed">
                  Dạ vâng, cảm ơn anh đã phản hồi. Em có thể phỏng vấn vào sáng mai lúc 9:00 được
                  không ạ?
                </div>
              </div>

              <div className="flex justify-start gap-4 max-w-[80%]">
                <Avatar
                  name={INITIAL_CHATS[activeChat].name}
                  size="sm"
                  className="rounded-xl shrink-0"
                />
                <div className="p-5 bg-white rounded-[24px] rounded-tl-none border border-slate-100 shadow-sm text-base font-medium text-slate-700 leading-relaxed">
                  {INITIAL_CHATS[activeChat].lastMsg}
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-8 pt-0">
              <div className="bg-white rounded-[32px] p-2 flex items-center gap-2 border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-1 pl-2">
                  <button className="p-2.5 text-slate-300 hover:text-primary-600 transition-colors duration-200 ease-out">
                    <Paperclip size={20} />
                  </button>
                  <button className="p-2.5 text-slate-300 hover:text-primary-600 transition-colors duration-200 ease-out">
                    <Image size={20} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="flex-grow py-4 px-4 text-base font-medium outline-none placeholder:text-slate-300"
                />
                <button className="p-2.5 text-slate-300 hover:text-amber-500 transition-colors duration-200 ease-out">
                  <Smile size={20} />
                </button>
                <button className="w-12 h-12 bg-primary-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-100 transition-colors duration-200 ease-out">
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MessagesPage;
