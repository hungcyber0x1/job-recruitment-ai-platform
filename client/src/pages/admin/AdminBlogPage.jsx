import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { blogService, unwrapBlogListResponse } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const AdminBlogPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  /** '' = mọi bài (admin + employer); backend không lọc */
  const [authorFilter, setAuthorFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [listMeta, setListMeta] = useState({ total: 0, totalPages: 1, page: 1, pageSize: 20 });

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await blogService.listAdmin({
        search: appliedSearch.trim() || undefined,
        author_type: authorFilter || undefined,
        page,
        page_size: pageSize,
      });
      setItems(unwrapBlogListResponse(res));
      const m = res?.data?.meta;
      if (m && typeof m.total === 'number') {
        setListMeta({
          total: m.total,
          totalPages: m.totalPages ?? 1,
          page: m.page ?? page,
          pageSize: m.pageSize ?? pageSize,
        });
      } else {
        const rows = unwrapBlogListResponse(res);
        setListMeta({ total: rows.length, totalPages: 1, page: 1, pageSize: rows.length });
      }
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Không tải được danh sách. Kiểm tra API, bảng blog_posts và quyền admin.';
      setLoadError(typeof msg === 'string' ? msg : 'Lỗi tải dữ liệu');
      setItems([]);
      setListMeta({ total: 0, totalPages: 1, page: 1, pageSize });
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, authorFilter, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [appliedSearch, authorFilter, pageSize]);

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
      await blogService.createAdmin(payload);
    } else if (editing?.id) {
      await blogService.updateAdmin(editing.id, payload);
    }
    await fetchList();
  };

  const handleDelete = async (id, row) => {
    const extra =
      row?.author_type === 'employer'
        ? '\n\nBài do nhà tuyển dụng đăng — xóa sẽ gỡ vĩnh viễn khỏi blog công khai.'
        : '';
    if (!window.confirm(`Xóa bài viết này?${extra}`)) return;
    try {
      await blogService.deleteAdmin(id);
      await fetchList();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <BookOpen className="size-7 text-emerald-600" />
              Quản lý blog toàn hệ thống
            </h1>
            <p className="mt-1 text-base text-muted-foreground max-w-3xl leading-relaxed">
              Toàn bộ bài trên{' '}
              <Link to="/blog" className="font-medium text-emerald-600 hover:underline">
                /blog
              </Link>{' '}
              đều đọc từ bảng{' '}
              <code className="rounded bg-muted px-1 text-base font-mono text-foreground">
                blog_posts
              </code>{' '}
              trong MySQL — kể cả bài nhập từ seed/migration. Tài khoản{' '}
              <span className="font-medium text-foreground">admin</span> quản lý{' '}
              <span className="font-medium text-foreground">mọi</span> bài (quản trị + nhà tuyển
              dụng), <span className="font-medium text-foreground">kể cả nháp</span>. Trang công
              khai chỉ hiển thị bài đã xuất bản; tại đây bạn tạo mới, sửa, gỡ xuất bản hoặc xóa.
            </p>
            {!loading && !loadError ? (
              <p className="mt-2 text-base font-medium text-emerald-800">
                Tổng <span className="tabular-nums font-semibold">{listMeta.total}</span> bài trong
                CSDL — đang xem <span className="tabular-nums font-semibold">{listMeta.page}</span>{' '}
                / <span className="tabular-nums font-semibold">{listMeta.totalPages}</span> (
                <span className="tabular-nums">{listMeta.pageSize}</span> bài/trang). Cuộn bảng hoặc
                dùng nút Trang trước/sau phía dưới.
              </p>
            ) : null}
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            Viết bài mới
          </Button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label
              htmlFor="admin-blog-source"
              className="text-base font-medium text-muted-foreground whitespace-nowrap"
            >
              Nguồn bài
            </label>
            <select
              id="admin-blog-source"
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="h-10 min-w-[200px] rounded-md border border-border bg-white px-3 text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
            >
              <option value="">Tất cả (quản trị + nhà tuyển dụng)</option>
              <option value="admin">Chỉ bài quản trị</option>
              <option value="employer">Chỉ bài nhà tuyển dụng</option>
            </select>
          </div>
          <Input
            placeholder="Tìm theo tiêu đề, slug, chuyên mục, tóm tắt, công ty, tác giả…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setAppliedSearch(searchInput.trim());
            }}
            className="max-w-md bg-white lg:max-w-sm"
          />
          <Button
            variant="outline"
            type="button"
            onClick={() => setAppliedSearch(searchInput.trim())}
          >
            Tìm
          </Button>
        </div>

        <div className="data-table-shell">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Đang tải…</div>
          ) : loadError ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-destructive font-medium">{loadError}</p>
              <p className="text-base text-muted-foreground max-w-lg mx-auto">
                Mở tab Network (F12) xem request{' '}
                <code className="text-base bg-muted px-1 rounded">GET …/admin/blog/posts</code>— nếu
                401 thì đăng nhập lại; 404/500 thường do sai URL API hoặc chưa chạy migration bảng
                blog.
              </p>
              <Button type="button" variant="outline" onClick={() => fetchList()}>
                Thử lại
              </Button>
            </div>
          ) : listMeta.total === 0 && items.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2 max-w-lg mx-auto">
              {appliedSearch.trim() || authorFilter ? (
                <>
                  <p className="font-medium text-foreground">
                    Không có bài khớp bộ lọc hoặc từ khóa.
                  </p>
                  <p className="text-base">
                    Thử xóa từ khóa, chọn nguồn bài{' '}
                    <span className="font-medium text-foreground">Tất cả</span>, hoặc bấm{' '}
                    <span className="font-medium text-foreground">Tìm</span> lại sau khi để trống ô
                    tìm.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">
                    Chưa có bài viết nào trong hệ thống.
                  </p>
                  <p>
                    Bấm nút <span className="font-semibold text-emerald-700">Viết bài mới</span>{' '}
                    phía trên để tạo bài, hoặc trong thư mục{' '}
                    <code className="text-base bg-muted px-1 rounded">server</code> chạy:
                  </p>
                  <pre className="mx-auto max-w-md rounded-lg bg-slate-900 px-4 py-3 text-left text-base text-slate-100">
                    npm run db:migrate{'\n'}
                    npm run db:seed
                  </pre>
                  <p className="text-base">
                    Đảm bảo file <code className="rounded bg-muted px-1">.env</code> trong{' '}
                    <code className="rounded bg-muted px-1">server</code> trỏ đúng MySQL mà gateway
                    đang dùng.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="data-table-scroll">
                <table className="data-table text-base">
                  <thead>
                    <tr>
                      <th className="px-4 py-3">Tiêu đề</th>
                      <th className="px-4 py-3">Chuyên mục</th>
                      <th className="px-4 py-3">Tác giả</th>
                      <th className="px-4 py-3">Lượt xem</th>
                      <th className="px-4 py-3">Công khai</th>
                      <th className="px-4 py-3">Cập nhật</th>
                      <th className="px-4 py-3 !text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id}>
                        <td className="max-w-xs px-4 py-3">
                          <p className="font-medium text-foreground line-clamp-2">{row.title}</p>
                          <p className="mt-0.5 text-base text-muted-foreground font-mono">
                            {row.slug}
                          </p>
                        </td>
                        <td className="max-w-[10rem] px-4 py-3 text-base text-foreground">
                          {row.category ? (
                            <span className="line-clamp-2 rounded-md bg-slate-100 px-2 py-1">
                              {row.category}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span
                            className={
                              row.author_type === 'employer'
                                ? 'rounded-md bg-amber-50 px-2 py-0.5 text-base font-medium text-amber-900'
                                : 'rounded-md bg-slate-100 px-2 py-0.5 text-base font-medium text-slate-700'
                            }
                          >
                            {row.author_type === 'employer'
                              ? 'Nhà tuyển dụng'
                              : row.author_type === 'admin'
                                ? 'Quản trị'
                                : row.author_type || '—'}
                          </span>
                          {row.author_name ? (
                            <span className="mt-1 block text-base text-foreground">
                              {row.author_name.trim()}
                            </span>
                          ) : null}
                          {row.company_name ? (
                            <span className="mt-0.5 block text-base">{row.company_name}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-base tabular-nums text-muted-foreground whitespace-nowrap">
                          {typeof row.view_count === 'number'
                            ? row.view_count.toLocaleString('vi-VN')
                            : typeof row.viewCount === 'number'
                              ? row.viewCount.toLocaleString('vi-VN')
                              : '—'}
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
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
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
                              onClick={() => handleDelete(row.id, row)}
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
              <div className="flex flex-col gap-3 border-t border-border/60 bg-slate-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-base text-muted-foreground">
                  <span className="font-medium text-foreground">{listMeta.total}</span> bài · trang{' '}
                  <span className="tabular-nums font-medium text-foreground">
                    {listMeta.page}/{listMeta.totalPages}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="admin-blog-page-size"
                    className="text-base text-muted-foreground whitespace-nowrap"
                  >
                    Số bài/trang
                  </label>
                  <select
                    id="admin-blog-page-size"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-9 rounded-md border border-border bg-white px-2 text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-2"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-label="Trang trước"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="min-w-[4.5rem] text-center text-base tabular-nums text-muted-foreground">
                      {listMeta.page} / {listMeta.totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 px-2"
                      disabled={page >= listMeta.totalPages || loading}
                      onClick={() => setPage((p) => p + 1)}
                      aria-label="Trang sau"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <BlogPostEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialRow={editing}
        onSubmit={handleSubmit}
      />
    </AdminLayout>
  );
};

export default AdminBlogPage;
