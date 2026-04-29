import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

import adminChatbotService from '../../../services/adminChatbotService';

const ChatbotTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'career_advice',
    is_active: true,
  });

  const categories = [
    { value: 'career_advice', label: 'Tư vấn nghề nghiệp' },
    { value: 'resume_analysis', label: 'Hỗ trợ CV và resume' },
    { value: 'interview_prep', label: 'Chuẩn bị phỏng vấn' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await adminChatbotService.getTemplates();
      setTemplates(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      title: '',
      content: '',
      category: 'career_advice',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      content: template.content,
      category: template.category,
      is_active: template.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await adminChatbotService.updateTemplate(editingTemplate.id, formData);
      } else {
        await adminChatbotService.createTemplate(formData);
      }
      setShowModal(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Lỗi khi lưu mẫu câu hỏi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mẫu câu hỏi này?')) return;

    try {
      await adminChatbotService.deleteTemplate(id);
      setTemplates((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const groupedTemplates = categories.map((category) => ({
    ...category,
    templates: templates.filter((template) => template.category === category.value),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Mẫu câu hỏi gợi ý</h2>
          <p className="text-base text-muted-foreground">
            Quản lý các câu hỏi gợi ý cho người dùng
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus size={20} />
          Thêm mẫu mới
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : (
        groupedTemplates.map((group) => (
          <div key={group.value} className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <div className="h-2 w-2 rounded-full bg-primary" />
              {group.label}
              <span className="text-sm font-normal text-muted-foreground">
                ({group.templates.length})
              </span>
            </h3>

            {group.templates.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">Chưa có mẫu câu hỏi nào</p>
            ) : (
              <div className="space-y-3">
                {group.templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start justify-between gap-4 rounded-xl bg-muted p-4 transition-colors hover:bg-muted/80"
                  >
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="font-bold text-foreground">{template.title}</h4>
                        {!template.is_active && (
                          <span className="rounded bg-border px-2 py-0.5 text-sm font-bold text-muted-foreground">
                            Tắt
                          </span>
                        )}
                      </div>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {typeof template.content === 'string'
                          ? template.content
                          : (template.content?.content ?? template.content?.title ?? '')}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Sử dụng: {template.usage_count || 0} lần</span>
                        <span>
                          Tạo: {new Date(template.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="rounded-lg p-2 text-state-danger transition-colors hover:bg-state-danger/10"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">
                {editingTemplate ? 'Chỉnh sửa mẫu' : 'Thêm mẫu mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 transition-colors hover:bg-muted"
                aria-label="Đóng hộp thoại"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="VD: Cách viết CV chuyên nghiệp"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Nội dung</label>
                <textarea
                  value={formData.content}
                  onChange={(event) => setFormData({ ...formData, content: event.target.value })}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="VD: Hãy cho tôi lời khuyên về cách viết CV chuyên nghiệp..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-foreground">Danh mục</label>
                <select
                  value={formData.category}
                  onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(event) =>
                    setFormData({ ...formData, is_active: event.target.checked })
                  }
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm font-bold text-foreground">
                  Kích hoạt mẫu này
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-border bg-card px-6 py-3 font-bold text-foreground transition-colors hover:bg-muted"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Save size={18} />
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotTemplates;
