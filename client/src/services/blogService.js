import api from './api';

/** API blog trả { success, data: T[] }. Shape lệch là lỗi dữ liệu, không dùng fallback giả. */
export function unwrapBlogListResponse(res) {
  const body = res?.data;
  if (body?.success === true && Array.isArray(body.data)) return body.data;
  throw new Error('BLOG_LIST_RESPONSE_INVALID');
}

/** Chi tiết bài: { success, data }. Shape lệch là lỗi dữ liệu, không dùng fallback giả. */
export function unwrapBlogDetailResponse(res) {
  const body = res?.data;
  if (body?.success === true && body.data && typeof body.data === 'object') return body.data;
  throw new Error('BLOG_DETAIL_RESPONSE_INVALID');
}

export function unwrapBlogTaxonomyResponse(res) {
  const body = res?.data;
  if (body?.success === true && body.data && typeof body.data === 'object') {
    return {
      categories: Array.isArray(body.data.categories) ? body.data.categories : [],
      tags: Array.isArray(body.data.tags) ? body.data.tags : [],
    };
  }
  throw new Error('BLOG_TAXONOMY_RESPONSE_INVALID');
}

export const blogService = {
  listPublic: (params) => api.get('blog/posts', { params }),
  getPublicTaxonomy: () => api.get('blog/taxonomy'),
  getBySlug: (slug) => api.get(`blog/posts/${encodeURIComponent(slug)}`),
  listAdmin: (params) => api.get('admin/blog/posts', { params }),
  createAdmin: (data) => api.post('admin/blog/posts', data),
  updateAdmin: (id, data) => api.put(`admin/blog/posts/${id}`, data),
  deleteAdmin: (id) => api.delete(`admin/blog/posts/${id}`),
  updateStatus: (id, data) => api.patch(`admin/blog/posts/${id}/status`, data),
  bulkAction: (data) => api.post('admin/blog/posts/bulk-action', data),
  listEmployer: () => api.get('employers/blog/posts'),
  createEmployer: (data) => api.post('employers/blog/posts', data),
  updateEmployer: (id, data) => api.put(`employers/blog/posts/${id}`, data),
  deleteEmployer: (id) => api.delete(`employers/blog/posts/${id}`),
};

export default blogService;
