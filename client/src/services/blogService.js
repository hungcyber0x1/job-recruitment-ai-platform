import api from './api';

/** API blog trả { success, data: T[] } — chuẩn hóa để tránh list rỗng khi shape lệch */
export function unwrapBlogListResponse(res) {
  const body = res?.data;
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body)) return body;
  return [];
}

/** Chi tiết bài: { success, data } — tránh lấy nhầm khi success: false */
export function unwrapBlogDetailResponse(res) {
  const body = res?.data;
  if (!body || typeof body !== 'object') return null;
  if (body.success === false) return null;
  const d = body.data;
  if (d && typeof d === 'object') return d;
  return null;
}

export const blogService = {
  listPublic: (params) => api.get('blog/posts', { params }),
  getBySlug: (slug) => api.get(`blog/posts/${encodeURIComponent(slug)}`),
  listAdmin: (params) => api.get('admin/blog/posts', { params }),
  createAdmin: (data) => api.post('admin/blog/posts', data),
  updateAdmin: (id, data) => api.put(`admin/blog/posts/${id}`, data),
  deleteAdmin: (id) => api.delete(`admin/blog/posts/${id}`),
  listEmployer: () => api.get('employers/blog/posts'),
  createEmployer: (data) => api.post('employers/blog/posts', data),
  updateEmployer: (id, data) => api.put(`employers/blog/posts/${id}`, data),
  deleteEmployer: (id) => api.delete(`employers/blog/posts/${id}`),
};

export default blogService;
