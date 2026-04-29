import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  X,
  Save,
  Globe,
  FileText,
  Calendar,
  Image as ImageIcon,
  RefreshCw,
  AlertTriangle,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import { slugify } from '@/utils/slugify';
import { useAuth } from '@/context/AuthContext';
import RichTextEditor from '../common/RichTextEditor';

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  image_url: '',
  category: 'Technology',
  is_published: false,
  status: 'published',
  is_featured: false,
  is_flagged: false,
  scheduled_at: '',
  rejection_reason: '',
};

export default function BlogPostEditorDialog({ open, onOpenChange, mode, initialRow, onSubmit }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [manualSlug, setManualSlug] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    setManualSlug(mode === 'edit');
    if (mode === 'edit' && initialRow) {
      setForm({
        title: initialRow.title || '',
        slug: initialRow.slug || '',
        excerpt: initialRow.excerpt || '',
        content: initialRow.content || '',
        image_url: initialRow.image_url || '',
        category: initialRow.category || 'Technology',
        is_published: Boolean(initialRow.is_published),
        status: initialRow.status || 'published',
        is_featured: Boolean(initialRow.is_featured),
        is_flagged: Boolean(initialRow.is_flagged),
        scheduled_at: initialRow.scheduled_at ? new Date(initialRow.scheduled_at).toISOString().slice(0, 16) : '',
        rejection_reason: initialRow.rejection_reason || '',
      });
    } else {
      setForm({ ...emptyForm, status: isAdmin ? 'published' : 'pending' });
    }
  }, [open, mode, initialRow, isAdmin]);

  useEffect(() => {
    if (mode === 'create' && !manualSlug && form.title) {
      setForm(f => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title, mode, manualSlug]);

  const handleSave = async () => {
    if (!form.title?.trim()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt?.trim() || undefined,
        content: form.content || undefined,
        image_url: form.image_url?.trim() || undefined,
        category: form.category?.trim() || 'Technology',
        is_published: form.is_published,
        status: form.status,
        is_featured: form.is_featured,
        is_flagged: form.is_flagged,
        scheduled_at: form.scheduled_at || null,
        rejection_reason: form.status === 'rejected' ? form.rejection_reason : undefined,
      };
      if (form.slug?.trim()) {
        payload.slug = form.slug.trim();
      }
      await onSubmit(payload);
      onOpenChange(false);
    } catch (e) {
      setSubmitError(e?.response?.data?.message || 'Lỗi hệ thống. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const editorKey = open && initialRow?.id ? `bp-edit-${initialRow.id}` : 'bp-new';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-4 sm:top-8 left-1/2 -translate-x-1/2 w-[98vw] sm:max-w-6xl p-0 border-none shadow-2xl bg-slate-50 rounded-[2.5rem] flex flex-col overflow-hidden h-[calc(100vh-32px)] sm:h-[calc(100vh-64px)] translate-y-0 focus:outline-none">
        {/* Header */}
        <div className="px-10 py-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
              {mode === 'create' ? <Plus size={24} /> : <FileText size={24} />}
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 tracking-normal">
                {mode === 'create' ? 'Tạo bài viết mới' : 'Biên tập bài viết'}
              </DialogTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-normal mt-1">
                {isAdmin ? 'Quản trị viên' : 'Nhà tuyển dụng'} &bull; {mode === 'create' ? 'Bản thảo mới' : 'Cập nhật nội dung'}
              </p>
            </div>
          </div>
          <DialogDescription className="sr-only">
            {mode === 'create' ? 'Tạo bài viết blog mới' : 'Chỉnh sửa bài viết blog'}
          </DialogDescription>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
          <div className="px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-8">
              {/* Primary Details Card */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
                <div className="grid gap-3">
                  <Label className="text-xs font-bold uppercase tracking-normal text-slate-400 ml-1">Tiêu đề bài viết</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Nhập tiêu đề thu hút độc giả..."
                    className="h-14 rounded-xl text-xl font-bold border-slate-100 bg-slate-50/30 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all px-6"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-3">
                    <Label className="text-xs font-bold uppercase tracking-normal text-slate-400 ml-1">Đường dẫn thân thiện (Slug)</Label>
                    <div className="relative group">
                      <Input
                        value={form.slug}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, slug: e.target.value }));
                          setManualSlug(true);
                        }}
                        placeholder="tieu-de-bai-viet"
                        className="h-12 rounded-xl border-slate-100 bg-slate-50/30 font-mono text-xs pr-12 focus:bg-white transition-all pl-6"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                        <RefreshCw
                          size={14}
                          className={cn("cursor-pointer hover:text-slate-900 transition-all", !manualSlug && "text-emerald-500 animate-pulse")}
                          onClick={() => {
                            setManualSlug(false);
                            setForm(f => ({ ...f, slug: slugify(f.title) }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label className="text-xs font-bold uppercase tracking-normal text-slate-400 ml-1">Danh mục bài viết</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm(f => ({ ...f, category: v }))}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/30 px-6 font-bold text-slate-700">
                        <SelectValue placeholder="Chọn danh mục..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="Technology">Công nghệ & AI</SelectItem>
                        <SelectItem value="Career">Phát triển sự nghiệp</SelectItem>
                        <SelectItem value="Interview">Kỹ năng phỏng vấn</SelectItem>
                        <SelectItem value="Recruitment">Tin tuyển dụng</SelectItem>
                        <SelectItem value="Company">Văn hóa công ty</SelectItem>
                        <SelectItem value="Market">Thị trường lao động</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label className="text-xs font-bold uppercase tracking-normal text-slate-400 ml-1">Mô tả ngắn (Excerpt)</Label>
                  <Textarea
                    rows={3}
                    value={form.excerpt}
                    onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                    placeholder="Tóm tắt nội dung để hiển thị trên danh sách bài viết..."
                    className="rounded-xl border-slate-100 bg-slate-50/30 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all p-6 resize-none"
                  />
                </div>

                {/* Rich Text Editor - The main content area */}
                <div className="grid gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <Label className="text-xs font-bold uppercase tracking-normal text-slate-400">Nội dung bài viết</Label>
                    <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-0.5">
                      <Info size={11} />
                      <span className="text-[10px] font-bold uppercase tracking-normal">Soạn thảo trực quan</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-inner shadow-slate-50">
                    <RichTextEditor
                      key={editorKey}
                      value={form.content}
                      onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                      placeholder="Bắt đầu câu chuyện của bạn tại đây..."
                      minHeight="420px"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium px-1">
                    Sử dụng thanh công cụ bên dưới để định dạng: <strong>in đậm</strong>, <em>in nghiêng</em>, tiêu đề, danh sách, chèn ảnh và liên kết.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Configuration Area */}
            <div className="lg:col-span-4 space-y-8">
              {/* Moderation Card */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-slate-900" />
                    <Label className="text-xs font-bold uppercase tracking-normal text-slate-900">Kiểm duyệt</Label>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 ml-1">Trạng thái hiện tại</Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) => setForm(f => ({ ...f, status: v }))}
                        disabled={!isAdmin && form.status !== 'published'}
                      >
                        <SelectTrigger className={cn(
                          "h-12 rounded-xl border-slate-100 font-bold",
                          form.status === 'published' ? "text-emerald-600 bg-emerald-50/30 border-emerald-100" :
                          form.status === 'pending' ? "text-amber-600 bg-amber-50/30 border-amber-100" :
                          form.status === 'rejected' ? "text-rose-600 bg-rose-50/30 border-rose-100" :
                          "text-slate-600 bg-slate-50"
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                          <SelectItem value="published" className="focus:bg-emerald-50 focus:text-emerald-700 font-bold">Xuất bản Công khai</SelectItem>
                          <SelectItem value="pending" className="focus:bg-amber-50 focus:text-amber-700 font-bold">Chờ phê duyệt</SelectItem>
                          <SelectItem value="rejected" className="focus:bg-rose-50 focus:text-rose-700 font-bold text-rose-600">Vi phạm / Từ chối</SelectItem>
                          <SelectItem value="archived" className="focus:bg-slate-50 focus:text-slate-700 font-bold">Lưu trữ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {form.status === 'rejected' && (
                      <div className="grid gap-3 pt-2 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2 text-rose-600">
                          <AlertTriangle size={14} />
                          <Label className="text-xs font-bold uppercase tracking-normal">Lý do từ chối bài viết</Label>
                        </div>
                        <Textarea
                          value={form.rejection_reason}
                          onChange={(e) => setForm(f => ({ ...f, rejection_reason: e.target.value }))}
                          placeholder="Mô tả lỗi vi phạm cho tác giả..."
                          className="rounded-xl border-rose-100 bg-rose-50/30 text-xs font-medium p-4 focus:bg-white transition-all shadow-none h-24"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-50" />

                {/* Display Options */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-slate-900" />
                    <Label className="text-xs font-bold uppercase tracking-normal text-slate-900">Tùy chỉnh hiển thị</Label>
                  </div>

                  <div className="grid gap-3">
                    <div
                      onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-[1.5rem] border cursor-pointer transition-all duration-300 group",
                        form.is_featured ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-slate-50 border-slate-100 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                          form.is_featured ? "bg-amber-400 text-white" : "bg-white text-slate-300"
                        )}>
                          <Star size={18} fill={form.is_featured ? "white" : "none"} strokeWidth={form.is_featured ? 1 : 2.5} />
                        </div>
                        <div>
                          <p className={cn("text-xs font-bold uppercase tracking-normal transition-colors", form.is_featured ? "text-amber-700" : "text-slate-600")}>Bài viết nổi bật</p>
                          <p className="text-xs text-slate-400 font-medium">Hiện trên trang chủ</p>
                        </div>
                      </div>
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center",
                        form.is_featured ? "border-amber-500 bg-amber-500" : "border-slate-300 bg-transparent"
                      )}>
                        {form.is_featured && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </div>

                    {isAdmin && (
                      <div
                        onClick={() => setForm(f => ({ ...f, is_flagged: !f.is_flagged }))}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-[1.5rem] border cursor-pointer transition-all duration-300 group",
                          form.is_flagged ? "bg-rose-50 border-rose-200 shadow-sm" : "bg-slate-50 border-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                            form.is_flagged ? "bg-rose-500 text-white" : "bg-white text-slate-300"
                          )}>
                            <AlertTriangle size={18} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className={cn("text-xs font-bold uppercase tracking-normal transition-colors", form.is_flagged ? "text-rose-700" : "text-slate-600")}>Đánh dấu vi phạm</p>
                            <p className="text-xs text-slate-400 font-medium">Ẩn bài ngay lập tức</p>
                          </div>
                        </div>
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center",
                          form.is_flagged ? "border-rose-500 bg-rose-500" : "border-slate-300 bg-transparent"
                        )}>
                          {form.is_flagged && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-50" />

                {/* Advanced Settings */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-slate-900" />
                      <Label className="text-xs font-bold uppercase tracking-normal text-slate-900">Cài đặt nâng cao</Label>
                    </div>

                    <div className="grid gap-5">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-500 flex items-center gap-2 ml-1">
                          <Clock size={14} className="text-slate-300" /> Ngày xuất bản dự kiến
                        </Label>
                        <Input
                          type="datetime-local"
                          value={form.scheduled_at}
                          onChange={(e) => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                          className="h-12 rounded-xl border-slate-100 bg-slate-50/50 text-xs font-bold focus:bg-white transition-all px-4"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-500 ml-1">Ảnh đại diện (Thumbnail)</Label>
                        <Input
                          value={form.image_url}
                          onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                          placeholder="Dán link ảnh tại đây..."
                          className="h-12 rounded-xl border-slate-100 bg-slate-50/50 text-xs font-medium focus:bg-white transition-all px-4"
                        />
                        {form.image_url ? (
                          <div className="mt-4 group relative aspect-video rounded-[1.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-200 animate-in zoom-in-95 duration-500">
                            <img
                              src={form.image_url}
                              alt="Preview"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-all pointer-events-none" />
                          </div>
                        ) : (
                          <div className="mt-2 aspect-video rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center gap-2 py-6">
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-300 border border-slate-100 shadow-sm">
                              <ImageIcon size={18} />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-normal text-slate-300">Chưa có ảnh</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-8 bg-white border-t border-slate-100 flex items-center justify-between shrink-0 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div
            onClick={() => setForm((f) => ({ ...f, is_published: !f.is_published }))}
            className="flex items-center gap-4 cursor-pointer group"
          >
            <div className={cn(
              "h-6 w-11 rounded-full transition-all duration-300 relative border-2 shadow-inner",
              form.is_published ? "bg-emerald-500 border-emerald-400" : "bg-slate-200 border-slate-100"
            )}>
              <div className={cn(
                "h-4 w-4 rounded-full bg-white shadow-md absolute top-1/2 -translate-y-1/2 transition-all duration-300",
                form.is_published ? "left-[22px]" : "left-[4px]"
              )} />
            </div>
            <div>
              <Label className="font-bold text-slate-900 cursor-pointer text-sm leading-none block">Hiển thị công khai</Label>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-normal mt-1">Sẵn sàng xuất bản chính thức</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-14 px-8 rounded-xl font-bold uppercase tracking-normal text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title?.trim()}
              className={cn(
                "h-14 px-12 rounded-xl text-white font-bold uppercase tracking-normal shadow-2xl transition-all active:scale-95",
                form.is_published
                  ? "bg-slate-900 hover:bg-black shadow-slate-200"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
              )}
            >
              {saving ? (
                <><RefreshCw size={20} className="mr-3 animate-spin" /> Đang xử lý...</>
              ) : (
                <><CheckCircle2 size={20} className="mr-3" /> {mode === 'create' ? 'Tạo bài ngay' : 'Lưu cập nhật'}</>
              )}
            </Button>
          </div>
        </div>

        {submitError && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[30] animate-in slide-in-from-top-4 duration-500">
            <div className="px-6 py-3 rounded-xl bg-rose-600 text-white shadow-2xl shadow-rose-200 flex items-center gap-3 border border-rose-500">
              <AlertTriangle size={18} className="animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-normal">{submitError}</span>
              <button onClick={() => setSubmitError(null)} className="ml-2 hover:bg-white/10 rounded-full p-1 transition-colors">
                <XCircle size={14} />
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
