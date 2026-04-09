import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  image_url: '',
  category: 'Technology',
  is_published: false,
};

const BLOG_QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
  clipboard: { matchVisual: false },
};

const BLOG_QUILL_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'blockquote',
  'code-block',
  'link',
];

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {'create' | 'edit'} props.mode
 * @param {object | null} props.initialRow — hàng từ API (snake_case)
 * @param {(payload: object) => Promise<void>} props.onSubmit
 */
export default function BlogPostEditorDialog({ open, onOpenChange, mode, initialRow, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  /** Soạn trực quan (Quill) hoặc HTML thô — giữ tab HTML cho class/div tùy chỉnh Quill không hỗ trợ. */
  const [contentTab, setContentTab] = useState('visual');

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    setContentTab('visual');
    if (mode === 'edit' && initialRow) {
      setForm({
        title: initialRow.title || '',
        slug: initialRow.slug || '',
        excerpt: initialRow.excerpt || '',
        content: initialRow.content || '',
        image_url: initialRow.image_url || '',
        category: initialRow.category || 'Technology',
        is_published: Boolean(initialRow.is_published),
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, mode, initialRow]);

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
      };
      if (form.slug?.trim()) {
        payload.slug = form.slug.trim();
      }
      await onSubmit(payload);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message;
      const msg =
        status === 413
          ? 'Nội dung gửi lên quá lớn so với giới hạn máy chủ. Thử rút gọn HTML hoặc tải ảnh lên host khác rồi dán URL.'
          : typeof serverMsg === 'string'
            ? serverMsg
            : e?.message || 'Không lưu được. Kiểm tra kết nối và quyền admin.';
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  };

  const editorKey =
    open && mode === 'edit' && initialRow?.id != null
      ? `blog-${initialRow.id}`
      : open
        ? `blog-${mode}-new`
        : 'blog-closed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Bài viết mới' : 'Chỉnh sửa bài viết'}</DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'create'
              ? 'Điền tiêu đề và nội dung, chọn xuất bản để hiển thị trên blog công khai.'
              : 'Cập nhật nội dung bài viết và trạng thái xuất bản.'}
          </DialogDescription>
        </DialogHeader>
        {mode === 'edit' && initialRow?.author_type === 'employer' ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Bài do <strong>nhà tuyển dụng</strong> đăng. Bạn chỉnh với quyền quản trị; bài vẫn gắn
            công ty/tác giả gốc.
          </p>
        ) : null}
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="bp-title">Tiêu đề *</Label>
            <Input
              id="bp-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Tiêu đề bài viết"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bp-slug">Slug (tùy chọn)</Label>
            <Input
              id="bp-slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="Để trống để tự tạo từ tiêu đề"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bp-cat">Danh mục</Label>
            <Input
              id="bp-cat"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bp-excerpt">Tóm tắt</Label>
            <Textarea
              id="bp-excerpt"
              rows={3}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
              <Label className="text-base">Nội dung bài viết</Label>
              <div className="flex gap-1 rounded-lg border border-border/80 bg-muted/30 p-0.5">
                <Button
                  type="button"
                  variant={contentTab === 'visual' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => setContentTab('visual')}
                >
                  Soạn thảo
                </Button>
                <Button
                  type="button"
                  variant={contentTab === 'html' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => setContentTab('html')}
                >
                  HTML nguồn
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Dùng <strong>Soạn thảo</strong> cho định dạng thông thường. Chuyển{' '}
              <strong>HTML nguồn</strong> khi cần thẻ tùy chỉnh (ví dụ khối callout, class riêng) mà
              trình soạn không giữ nguyên.
            </p>
            {contentTab === 'visual' ? (
              <div className="blog-editor-quill rounded-md border border-input bg-background [&_.ql-container]:min-h-[220px] [&_.ql-editor]:min-h-[220px] [&_.ql-toolbar]:rounded-t-md [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-container]:border-0 [&_.ql-editor]:text-base [&_.ql-editor]:leading-relaxed">
                {open ? (
                  <ReactQuill
                    key={editorKey}
                    theme="snow"
                    value={form.content}
                    onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                    modules={BLOG_QUILL_MODULES}
                    formats={BLOG_QUILL_FORMATS}
                    placeholder="Viết nội dung bài viết…"
                  />
                ) : null}
              </div>
            ) : (
              <Textarea
                id="bp-content"
                rows={14}
                className="font-mono text-sm"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="<p>Nội dung HTML…</p>"
                spellCheck={false}
              />
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bp-img">URL ảnh đại diện</Label>
            <Input
              id="bp-img"
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="bp-pub"
              checked={form.is_published}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v === true }))}
            />
            <Label htmlFor="bp-pub" className="cursor-pointer font-normal">
              Xuất bản ngay (hiển thị trên blog công khai)
            </Label>
          </div>
        </div>
        {submitError ? (
          <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            {submitError}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !form.title?.trim()}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
