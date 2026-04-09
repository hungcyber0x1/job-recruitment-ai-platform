import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';

import adminChatbotService from '../../../services/adminChatbotService';

const ChatbotConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminChatbotService.getAllConversations({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
      });
      setConversations(response.data?.data?.conversations || []);
      setPagination((prev) => ({ ...prev, ...(response.data?.data?.pagination || {}) }));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.page, search]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const viewConversation = async (id) => {
    try {
      const response = await adminChatbotService.getConversationById(id);
      setSelectedConversation(response.data?.data || null);
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa cuộc hội thoại này?')) return;

    try {
      await adminChatbotService.deleteConversation(id);
      setConversations((prev) => prev.filter((conv) => conv.id !== id));
      if (selectedConversation?.conversation?.id === id) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={20}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo email, tên người dùng hoặc tiêu đề..."
              className="w-full rounded-xl border border-border bg-card py-3 pl-12 pr-4 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Người dùng
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Tiêu đề
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Số tin nhắn
                </th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Tạo lúc
                </th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                    </div>
                  </td>
                </tr>
              ) : conversations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Không tìm thấy cuộc hội thoại nào
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => (
                  <tr key={conv.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-foreground">
                          {conv.first_name} {conv.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{conv.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{conv.title}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                        {conv.message_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(conv.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => viewConversation(conv.id)}
                          className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(conv.id)}
                          className="rounded-lg p-2 text-state-danger transition-colors hover:bg-state-danger/10"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total} kết quả)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="rounded-lg border border-border p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="rounded-lg border border-border p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-xl font-black text-foreground">
                  {selectedConversation.conversation.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.conversation.user_email} -{' '}
                  {selectedConversation.conversation.role}
                </p>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="rounded-lg p-2 transition-colors hover:bg-muted"
                aria-label="Đóng hộp thoại"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {selectedConversation.messages.map((msg) => (
                <div key={msg.id} className={msg.is_ai ? 'flex justify-start' : 'flex justify-end'}>
                  <div
                    className={`max-w-[70%] rounded-2xl p-4 ${
                      msg.is_ai
                        ? 'rounded-tl-none bg-muted text-foreground'
                        : 'rounded-tr-none bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="font-medium leading-relaxed">{msg.message}</p>
                    {msg.attachment_url && (
                      <div className="mt-2 border-t border-border pt-2">
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline"
                        >
                          Tệp đính kèm
                        </a>
                      </div>
                    )}
                    <p className="mt-2 text-xs opacity-70">
                      {new Date(msg.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotConversations;
