/**
 * Blog Controller — handles blog post HTTP requests.
 *
 * ⚠️   TABLE: Sử dụng `blog_posts` với `author_id` (FK đến users)
 * ⚠️   ROLE: Sử dụng 'recruiter' thay vì 'employer'
 */
const BlogRepository = require('../models/Blog');
const CategoryRepository = require('../models/Category');
const ActivityLogRepository = require('../models/ActivityLog');
const NotificationRepository = require('../models/Notification');
const AppError = require('../utils/errorHandler');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
} = require('../utils/admin-permissions');
const {
  isCompanyAdmin,
  resolveRecruiterCompanyContext,
} = require('../utils/company-access');

function slugify(title) {
  const base = (title || 'bai-viet')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
  return base || 'bai-viet';
}

async function ensureUniqueSlug(base, excludeId = null) {
  let slug = base;
  let n = 0;
  while (await BlogRepository.slugExists(slug, excludeId)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

async function getOrCreateCategory(categoryName) {
  if (!categoryName) return null;
  const cat = await CategoryRepository.findByName(categoryName);
  if (cat) return cat.id;
  try {
    return await CategoryRepository.create({ name: categoryName, slug: slugify(categoryName) });
  } catch (err) {
    const fallback = await CategoryRepository.findByName(categoryName);
    return fallback ? fallback.id : null;
  }
}

function formatDateShortVi(row) {
  if (!row?.published_at) return null;
  const d = new Date(row.published_at);
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateLongVi(row) {
  if (!row?.published_at) return null;
  const d = new Date(row.published_at);
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toIsoDate(row) {
  if (!row?.published_at) return null;
  const d = new Date(row.published_at);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

class BlogController {
  listPublic = catchAsync(async (req, res) => {
    const { category, search, sort = 'newest' } = req.query;
    const posts = await BlogRepository.findPublished({ category, search, sort });
    const mapped = posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      image: p.thumbnail_url || p.image_url || null,
      author: p.author_name?.trim() || 'HireBOT',
      authorType: p.author_type,
      companyName: p.company_name || null,
      date: formatDateShortVi(p),
      category: p.category_name || p.category || null,
      viewCount: typeof p.view_count === 'number' ? p.view_count : 0,
      publishedAt: toIsoDate(p),
    }));
    return ApiResponse.success(res, mapped);
  });

  getPublicBySlug = catchAsync(async (req, res) => {
    const { slug } = req.params;
    const post = await BlogRepository.findBySlugForPublic(slug);
    if (!post) {
      return ApiResponse.notFound(res, 'Post');
    }
    await BlogRepository.incrementViewCount(post.id);
    const avatar =
      post.author_avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name || 'A')}&background=0D8ABC&color=fff`;
    return ApiResponse.success(res, {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image_url,
      author: post.author_name?.trim() || 'HireBOT',
      authorType: post.author_type,
      companyName: post.company_name || null,
      date: formatDateLongVi(post),
      publishedAt: toIsoDate(post),
      category: post.category,
      viewCount: (post.view_count || 0) + 1,
      avatar,
    });
  });

  listAdmin = catchAsync(async (req, res) => {
    const { search, author_type: authorTypeIn, status, flagged } = req.query;
    const authorType =
      authorTypeIn === 'admin' || authorTypeIn === 'recruiter' ? authorTypeIn : undefined;

    const rawPage = Number.parseInt(String(req.query.page || '1'), 10);
    const rawSize = Number.parseInt(String(req.query.page_size || req.query.limit || '20'), 10);
    const pageSize = Math.min(
      100,
      Math.max(5, Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 20)
    );

    const filter = { search, authorType, status, flagged: flagged === 'true' };
    const total = await BlogRepository.countAllAdmin(filter);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    let page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    if (page > totalPages) page = totalPages;
    const offset = (page - 1) * pageSize;
    const posts = await BlogRepository.findAllAdmin({
      ...filter,
      limit: pageSize,
      offset,
    });
    return ApiResponse.success(res, posts, {
      pagination: { page, limit: pageSize, total, pages: totalPages, hasMore: page < totalPages }
    });
  });

  createAdmin = catchAsync(async (req, res) => {
    const { title, excerpt, content, image_url, category, is_published, slug: slugIn } = req.body;
    if (!title) {
      return ApiResponse.error(res, 400, 'Tiêu đề là bắt buộc');
    }
    const base = slugIn ? slugify(slugIn) : slugify(title);
    const slug = await ensureUniqueSlug(base);
    const is_published_val = Boolean(is_published);
    const pub = is_published_val;
    const published_at = pub ? new Date() : null;
    const resolvedCategoryId = await getOrCreateCategory(category || 'Technology');
    const id = await BlogRepository.create({
      slug,
      title,
      excerpt,
      content,
      image_url,
      category_id: resolvedCategoryId,
      author_type: 'admin',
      author_id: req.user.id,
      company_id: null,
      is_published: pub,
      published_at,
      status: 'published',
    });
    const created = await BlogRepository.findById(id);
    return ApiResponse.created(res, created);
  });

  updateAdmin = catchAsync(async (req, res) => {
    const { id } = req.params;
    const row = await BlogRepository.findById(id);
    if (!row) throw new AppError('Không tìm thấy bài', 404);

    const { title, excerpt, content, image_url, category, is_published, slug: slugIn, status, rejection_reason, is_flagged, is_featured, scheduled_at } = req.body;
    let resolvedCategoryId = undefined;
    if (category) {
      resolvedCategoryId = await getOrCreateCategory(category);
    }
    const updates = { title, excerpt, content, image_url, category_id: resolvedCategoryId, status, rejection_reason, is_flagged, is_featured, scheduled_at };
    if (slugIn !== undefined) {
      const base = slugify(slugIn);
      updates.slug = await ensureUniqueSlug(base, Number(id));
    }
    if (is_published !== undefined) {
      updates.is_published = Boolean(is_published);
      if (updates.is_published && !row.published_at) {
        updates.published_at = new Date();
      }
      if (!updates.is_published) {
        updates.published_at = null;
      }
    }
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
    await BlogRepository.update(Number(id), updates);
    const updated = await BlogRepository.findById(id);
    return ApiResponse.success(res, updated);
  });

  deleteAdmin = catchAsync(async (req, res) => {
    const { id } = req.params;
    await BlogRepository.delete(Number(id));
    return ApiResponse.noContent(res);
  });

  listEmployer = catchAsync(async (req, res) => {
    const company = await resolveRecruiterCompanyContext(req.user);
    if (!company) {
      return ApiResponse.forbidden(res, 'Không tìm thấy hồ sơ nhà tuyển dụng');
    }
    const posts = await BlogRepository.findByCompany(company.id, { limit: 100, offset: 0 });
    return ApiResponse.success(res, posts);
  });

  createEmployer = catchAsync(async (req, res) => {
    const company = await resolveRecruiterCompanyContext(req.user);
    if (!company) {
      return ApiResponse.forbidden(res, 'Không tìm thấy hồ sơ nhà tuyển dụng');
    }
    if (!isCompanyAdmin(req.user)) {
      return ApiResponse.forbidden(res, 'Báº¡n khÃ´ng cÃ³ quyá»n táº¡o bÃ i viáº¿t cho cÃ´ng ty');
    }
    const { title, excerpt, content, image_url, category, is_published, slug: slugIn } = req.body;
    if (!title) {
      return ApiResponse.error(res, 400, 'Tiêu đề là bắt buộc');
    }
    const base = slugIn ? slugify(slugIn) : slugify(title);
    const slug = await ensureUniqueSlug(base);
    const resolvedCategoryId = await getOrCreateCategory(category || 'Career Tips');
    const pub = Boolean(is_published);
    const published_at = pub ? new Date() : null;
    const id = await BlogRepository.create({
      slug,
      title,
      excerpt,
      content,
      image_url,
      category_id: resolvedCategoryId,
      author_type: 'recruiter',
      author_id: req.user.id,
      company_id: company.id,
      is_published: pub,
      published_at,
      status: pub ? 'pending' : 'draft',
    });
    const created = await BlogRepository.findById(id);
    return ApiResponse.created(res, created);
  });

  updateEmployer = catchAsync(async (req, res) => {
    const company = await resolveRecruiterCompanyContext(req.user);
    if (!company) {
      return ApiResponse.forbidden(res, 'Không tìm thấy hồ sơ nhà tuyển dụng');
    }
    if (!isCompanyAdmin(req.user)) {
      return ApiResponse.forbidden(res, 'Báº¡n khÃ´ng cÃ³ quyá»n cáº­p nháº­t bÃ i viáº¿t cho cÃ´ng ty');
    }
    const { id } = req.params;
    const row = await BlogRepository.findById(id);
    if (!row || row.company_id !== company.id) {
      throw new AppError('Không tìm thấy bài hoặc không có quyền', 403);
    }
    const { title, excerpt, content, image_url, category, is_published, slug: slugIn } = req.body;
    let resolvedCategoryId = undefined;
    if (category) {
      resolvedCategoryId = await getOrCreateCategory(category);
    }
    const updates = { title, excerpt, content, image_url, category_id: resolvedCategoryId };
    if (slugIn !== undefined) {
      const base = slugify(slugIn);
      updates.slug = await ensureUniqueSlug(base, Number(id));
    }
    if (is_published !== undefined) {
      const pub = Boolean(is_published);
      updates.is_published = pub;
      if (pub && !row.published_at) {
        updates.published_at = new Date();
      }
      if (!pub) {
        updates.published_at = null;
      }
      if (pub && (row.status === 'draft' || row.status === 'rejected')) {
        updates.status = 'pending';
      } else if (!pub) {
        updates.status = 'draft';
      }
    }
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
    await BlogRepository.update(Number(id), updates);
    const updated = await BlogRepository.findById(id);
    return ApiResponse.success(res, updated);
  });

  deleteEmployer = catchAsync(async (req, res) => {
    const company = await resolveRecruiterCompanyContext(req.user);
    if (!company) {
      return ApiResponse.forbidden(res, 'Không tìm thấy hồ sơ nhà tuyển dụng');
    }
    if (!isCompanyAdmin(req.user)) {
      return ApiResponse.forbidden(res, 'Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a bÃ i viáº¿t cho cÃ´ng ty');
    }
    const { id } = req.params;
    const row = await BlogRepository.findById(id);
    if (!row || row.company_id !== company.id) {
      throw new AppError('Không tìm thấy bài hoặc không có quyền', 403);
    }
    await BlogRepository.delete(Number(id));
    return ApiResponse.noContent(res);
  });

  updateStatusAdmin = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, rejection_reason, is_flagged } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (rejection_reason !== undefined) updates.rejection_reason = rejection_reason;
    if (is_flagged !== undefined) updates.is_flagged = Boolean(is_flagged);

    if (status === 'published') {
      const post = await BlogRepository.findById(id);
      if (!post?.published_at) {
        updates.published_at = new Date();
        updates.is_published = true;
      }
    }

    const postBefore = await BlogRepository.findById(id);
    await BlogRepository.update(Number(id), updates);

    // Logging & Notification
    if (status && postBefore) {
      // Log activity
      await ActivityLogRepository.create({
        adminCode: req.user.code || req.user.id,
        userId: null,
        action: 'UPDATE_BLOG_STATUS',
        details: `Updated blog ${id} status: ${postBefore.status} -> ${status}`,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      // Notify external author if not admin
      if (postBefore.author_type !== 'admin' && postBefore.author_id) {
        let title, message;
        if (status === 'published') {
          title = 'Bài viết đã được duyệt';
          message = `Bài viết "${postBefore.title}" của bạn đã được xuất bản công khai.`;
        } else if (status === 'rejected') {
          title = 'Bài viết bị từ chối';
          message = `Bài viết "${postBefore.title}" của bạn đã bị từ chối. Lời nhắn: ${rejection_reason || 'Không có'}`;
        }
        
        if (title && message) {
          await NotificationRepository.create({
            user_id: postBefore.author_id,
            type: 'system',
            category: 'blog_update',
            title,
            message,
            data: { blog_id: id }
          });
        }
      }
    }

    return ApiResponse.success(res, null, { message: 'Cập nhật trạng thái bài viết thành công' });
  });

  bulkActionAdmin = catchAsync(async (req, res) => {
    const { ids, action, data = {} } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return ApiResponse.error(res, 400, 'Danh sách ID không hợp lệ');
    }

    if (action === 'delete' && !hasAdminPermission(req.user, ADMIN_PERMISSIONS.CONTENT_DELETE)) {
      return ApiResponse.forbidden(res, 'Only Super Admin can delete content in bulk');
    }

    for (const id of ids) {
      let updates = {};
      if (action === 'approve') {
        updates = { status: 'published', is_published: true, published_at: new Date() };
      } else if (action === 'reject') {
        updates = { status: 'rejected', rejection_reason: data.reason || 'Không đạt yêu cầu' };
      } else if (action === 'flag') {
        updates = { is_flagged: true };
      } else if (action === 'unflag') {
        updates = { is_flagged: false };
      } else if (action === 'feature') {
        updates = { is_featured: true };
      } else if (action === 'unfeature') {
        updates = { is_featured: false };
      } else if (action === 'delete') {
        await BlogRepository.delete(id);
        continue;
      }

      if (Object.keys(updates).length) {
        await BlogRepository.update(id, updates);
      }
    }

    return ApiResponse.success(res, null, { message: 'Thao tác hàng loạt hoàn tất' });
  });
}

module.exports = new BlogController();
