import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { blogService, unwrapBlogListResponse } from '@/services';
import { Button } from '@/components/ui/button';
import BlogPostEditorDialog from '@/components/blog/BlogPostEditorDialog';

const formatWhen = (row) => {
  const raw = row?.updated_at || row?.published_at || row?.created_at;
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('vi-VN');
  } catch {
    return '—';
  }
};

const EmployerBlogPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [editing, setEditing] = useState(null);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await blogService.listEmployer();
      setItems(unwrapBlogListResponse(res));
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setDialogMode('create');
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setDialogMode('edit');
    setEditing(row);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (dialogMode === 'create') {
      await blogService.createEmployer(payload);
    } else if (editing?.id) {
      await blogService.updateEmployer(editing.id, payload);
    }
    await fetchList();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bài viết này?')) return;
    try {
      await blogService.deleteEmployer(id);
      await fetchList();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <BookOpen className="size-7 text-emerald-600" />
            Blog thương hiệu
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Đăng bài dưới tên công ty trên{' '}
            <Link to="/blog" className="font-medium text-emerald-600 hover:underline">
              blog công khai
            </Link>
            .
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          Viết bài mới
        </Button>
      </div>

      <div className="data-table-shell">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Đang tải…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Chưa có bài viết. Tạo bài để ứng viên đọc thêm về doanh nghiệp của bạn.
          </div>
        ) : (
          <div className="data-table-scroll">
            <table className="data-table text-base">
              <thead>
                <tr>
                  <th className="px-4 py-3">Tiêu đề</th>
                  <th className="px-4 py-3">Công khai</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="px-4 py-3 text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td className="max-w-xs px-4 py-3">
                      <p className="font-medium text-foreground line-clamp-2">{row.title}</p>
                      <p className="mt-0.5 text-base text-muted-foreground font-mono">{row.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      {row.is_published ? (
                        <span className="text-emerald-600 font-medium">Có</span>
                      ) : (
                        <span className="text-amber-600">Nháp</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-base">
                      {formatWhen(row)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {row.is_published && row.slug ? (
                          <Button variant="ghost" size="icon" asChild title="Xem công khai">
                            <a
                              href={`/blog/${encodeURIComponent(row.slug)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(row)}
                          title="Sửa"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(row.id)}
                          title="Xóa"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BlogPostEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialRow={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default EmployerBlogPage;
