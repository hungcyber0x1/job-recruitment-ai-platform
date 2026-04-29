import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Save, Trash2, Edit2, X, Check, Copy, MessageSquare,
  RefreshCw, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2
} from 'lucide-react';
import adminChatbotService from '../../../services/adminChatbotService';

const PROMPT_CATEGORIES = [
  { value: 'chatbot', label: 'Chatbot' },
  { value: 'career', label: 'Career' },
  { value: 'resume', label: 'Resume' },
  { value: 'interview', label: 'Interview' },
  { value: 'general', label: 'General' },
];

const SUGGESTED_VARIABLES = [
  '{{user_name}}', '{{user_email}}', '{{skills}}', '{{experience}}',
  '{{education}}', '{{job_title}}', '{{company}}', '{{intent}}',
];

const PromptManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'chatbot' });
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminChatbotService.getTemplates();
      setTemplates(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setMessage({ type: 'error', text: 'Lỗi tải mẫu prompt' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const showSuccess = (text) => {
    setMessage({ type: 'success', text });
    setTimeout(() => setMessage(null), 4000);
  };

  const showError = (text) => {
    setMessage({ type: 'error', text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showError('Tiêu đề và nội dung prompt không được để trống');
      return;
    }
    setSaving(true);
    try {
      await adminChatbotService.createTemplate(form);
      showSuccess('Đã tạo prompt thành công');
      setForm({ title: '', content: '', category: 'chatbot' });
      setShowForm(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      showError('Lỗi tạo prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!form.title.trim() || !form.content.trim()) {
      showError('Tiêu đề và nội dung prompt không được để trống');
      return;
    }
    setSaving(true);
    try {
      await adminChatbotService.updateTemplate(id, form);
      showSuccess('Đã cập nhật prompt thành công');
      setEditingId(null);
      setForm({ title: '', content: '', category: 'chatbot' });
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      showError('Lỗi cập nhật prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mẫu prompt này?')) return;
    try {
      await adminChatbotService.deleteTemplate(id);
      showSuccess('Đã xóa prompt thành công');
      if (editingId === id) setEditingId(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showError('Lỗi xóa prompt');
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    try {
      await adminChatbotService.updateTemplate(id, {
        ...template,
        is_active: !currentActive,
      });
      showSuccess(!currentActive ? 'Đã kích hoạt prompt' : 'Đã tắt prompt');
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      showError('Lỗi cập nhật trạng thái');
    }
  };

  const startEdit = (template) => {
    setEditingId(template.id);
    setForm({
      title: template.display_name || template.title,
      content: template.prompt_template || template.content,
      category: template.category,
    });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ title: '', content: '', category: 'chatbot' });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showSuccess('Đã copy vào clipboard');
    });
  };

  const insertVariable = (variable) => {
    setForm((prev) => ({
      ...prev,
      content: prev.content + variable,
    }));
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesSearch =
      !searchQuery ||
      (t.display_name || t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.prompt_template || t.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryCounts = templates.reduce((acc, t) => {
    const cat = t.category || 'general';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const activeCounts = templates.reduce((acc, t) => {
    const cat = t.category || 'general';
    if (t.is_active !== 0 && t.is_active !== false) {
      acc[cat] = (acc[cat] || 0) + 1;
    }
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 ${
            message.type === 'success'
              ? 'border-state-success/20 bg-state-success/10 text-state-success'
              : 'border-state-danger/20 bg-state-danger/10 text-state-danger'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-foreground">Quản lý Prompt</h2>
        <div className="flex gap-3">
          <button
            onClick={fetchTemplates}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-bold text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw size={18} />
            Làm mới
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm({ title: '', content: '', category: 'chatbot' });
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus size={18} />
            Tạo Prompt Mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {[{ value: 'all', label: 'Tất cả' }, ...PROMPT_CATEGORIES].map((cat) => {
          const count = cat.value === 'all'
            ? templates.length
            : categoryCounts[cat.value] || 0;
          const active = cat.value === 'all'
            ? templates.filter((t) => t.is_active !== 0 && t.is_active !== false).length
            : activeCounts[cat.value] || 0;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`rounded-xl border p-4 text-left transition-all ${
                filterCategory === cat.value
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <p className="text-sm font-bold text-foreground">{cat.label}</p>
              <p className="text-2xl font-bold text-primary">{count}</p>
              <p className="text-xs text-muted-foreground">{active} đang bật</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm prompt..."
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {(showForm || editingId) && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">
            {editingId ? 'Chỉnh sửa Prompt' : 'Tạo Prompt Mới'}
          </h3>

          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-foreground">Tiêu đề</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="VD: Prompt chào mừng người dùng"
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-foreground">Danh mục</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                {PROMPT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-bold text-foreground">Nội dung Prompt</label>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground">Chèn biến:</span>
                {SUGGESTED_VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="rounded border border-border bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={10}
              placeholder="Nhập nội dung prompt... Sử dụng biến như {{user_name}}, {{skills}} để cá nhân hóa."
              className="w-full rounded-xl border border-border bg-card px-4 py-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowForm(false); cancelEdit(); }}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2 font-bold text-foreground transition-colors hover:bg-muted"
            >
              <X size={18} />
              Hủy
            </button>
            <button
              onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Tạo Prompt')}
            </button>
          </div>
        </div>
      )}

      {filteredTemplates.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            {searchQuery || filterCategory !== 'all'
              ? 'Không tìm thấy prompt nào phù hợp'
              : 'Chưa có mẫu prompt nào. Tạo prompt đầu tiên!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`rounded-xl border bg-card p-5 transition-all ${
                template.is_active === 0 || template.is_active === false
                  ? 'border-border opacity-60'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-bold text-foreground truncate">
                      {template.display_name || template.title}
                    </h4>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                      {template.category || 'general'}
                    </span>
                    {(template.is_active === 0 || template.is_active === false) && (
                      <span className="shrink-0 rounded-full bg-state-danger/10 px-2.5 py-0.5 text-xs font-bold text-state-danger">
                        Tắt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ID: {template.id} · Tạo: {new Date(template.created_at).toLocaleString('vi-VN')}
                    {template.updated_at && template.updated_at !== template.created_at &&
                      ` · Cập nhật: ${new Date(template.updated_at).toLocaleString('vi-VN')}`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(template.id, template.is_active !== 0 && template.is_active !== false)}
                    className={`rounded-lg p-2 transition-colors ${
                      template.is_active !== 0 && template.is_active !== false
                        ? 'text-state-success hover:bg-state-success/10'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                    title={template.is_active !== 0 && template.is_active !== false ? 'Tắt prompt' : 'Kích hoạt prompt'}
                  >
                    {template.is_active !== 0 && template.is_active !== false ? (
                      <ToggleRight size={20} />
                    ) : (
                      <ToggleLeft size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(template.prompt_template || template.content)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Copy prompt"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={() => startEdit(template)}
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

              <div className="rounded-lg bg-muted/50 p-3">
                <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground leading-relaxed max-h-32 overflow-y-auto">
                  {template.prompt_template || template.content}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromptManager;
