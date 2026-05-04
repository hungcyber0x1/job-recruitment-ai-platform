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
const { ADMIN_PERMISSIONS, hasAdminPermission } = require('../utils/admin-permissions');
const { isCompanyAdmin, resolveRecruiterCompanyContext } = require('../utils/company-access');

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
  } catch {
    const fallback = await CategoryRepository.findByName(categoryName);
    return fallback ? fallback.id : null;
  }
}

function getPublicPublishedAt(row) {
  return (
    row?.public_published_at || row?.published_at || row?.updated_at || row?.created_at || null
  );
}

function formatDateShortVi(row) {
  const value = getPublicPublishedAt(row);
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateLongVi(row) {
  const value = getPublicPublishedAt(row);
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toIsoDate(row) {
  const value = getPublicPublishedAt(row);
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseTags(value) {
  if (!value) return [];
  let parsed = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = parsed.split(',');
    }
  }
  if (!Array.isArray(parsed)) return [];
  return [...new Set(parsed.map((tag) => String(tag || '').trim()).filter(Boolean))];
}

const PUBLIC_EDITORIAL_AUTHOR = {
  name: 'Ban biên tập HireBOT',
  role: 'Đội ngũ nội dung & phân tích tuyển dụng HireBOT',
  avatarName: 'HireBOT',
};

function buildUiAvatar(name, background = '0D8ABC', color = 'fff') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'HireBOT')}&background=${background}&color=${color}`;
}

function resolvePublicAuthorMeta(row) {
  const authorType = row?.author_type || 'admin';
  const rawAuthorName = (row?.author_name || '').trim();
  const companyName = (row?.company_name || '').trim();

  if (authorType === 'admin') {
    return {
      author: PUBLIC_EDITORIAL_AUTHOR.name,
      authorRole: PUBLIC_EDITORIAL_AUTHOR.role,
      companyName: null,
      avatar: row?.author_avatar || buildUiAvatar(PUBLIC_EDITORIAL_AUTHOR.avatarName),
    };
  }

  if (authorType === 'recruiter') {
    const author = rawAuthorName || companyName || 'Nhà tuyển dụng HireBOT';
    return {
      author,
      authorRole: companyName ? `${companyName} · Nhà tuyển dụng` : 'Nhà tuyển dụng đã xác thực',
      companyName: companyName || null,
      avatar: row?.author_avatar || buildUiAvatar(author),
    };
  }

  const author = rawAuthorName || 'Cộng tác viên HireBOT';
  return {
    author,
    authorRole: 'Đóng góp nội dung',
    companyName: companyName || null,
    avatar: row?.author_avatar || buildUiAvatar(author),
  };
}

class BlogController {
  listPublic = catchAsync(async (req, res) => {
    const { category, tag, search, sort = 'newest', featured } = req.query;
    const posts = await BlogRepository.findPublished({ category, tag, search, sort, featured });
    const mapped = posts.map((p) => {
      const authorMeta = resolvePublicAuthorMeta(p);
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        image: p.thumbnail_url || p.featured_image || null,
        author: authorMeta.author,
        authorRole: authorMeta.authorRole,
        authorType: p.author_type,
        companyName: authorMeta.companyName,
        avatar: authorMeta.avatar,
        date: formatDateShortVi(p),
        category: p.category_name || p.category || null,
        categorySlug: p.category_slug || null,
        tags: parseTags(p.tags),
        isFeatured: Boolean(p.is_featured),
        viewCount: typeof p.view_count === 'number' ? p.view_count : 0,
        publishedAt: toIsoDate(p),
      };
    });
    return ApiResponse.success(res, mapped);
  });

  getPublicTaxonomy = catchAsync(async (_req, res) => {
    const taxonomy = await BlogRepository.findPublicTaxonomy();
    return ApiResponse.success(res, taxonomy);
  });

  getPublicBySlug = catchAsync(async (req, res) => {
    const { slug } = req.params;
    const post = await BlogRepository.findBySlugForPublic(slug);
    if (!post) {
      return ApiResponse.notFound(res, 'Post');
    }
    await BlogRepository.incrementViewCount(post.id);
    const authorMeta = resolvePublicAuthorMeta(post);
    return ApiResponse.success(res, {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image: post.thumbnail_url || post.featured_image || null,
      author: authorMeta.author,
      authorRole: authorMeta.authorRole,
      authorType: post.author_type,
      companyName: authorMeta.companyName,
      date: formatDateLongVi(post),
      publishedAt: toIsoDate(post),
      category: post.category_name || post.category || null,
      categorySlug: post.category_slug || null,
      tags: parseTags(post.tags),
      isFeatured: Boolean(post.is_featured),
      viewCount: (post.view_count || 0) + 1,
      avatar: authorMeta.avatar,
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
      pagination: { page, limit: pageSize, total, pages: totalPages, hasMore: page < totalPages },
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
      status: pub ? 'published' : 'draft',
    });
    const created = await BlogRepository.findById(id);
    return ApiResponse.created(res, created);
  });

  updateAdmin = catchAsync(async (req, res) => {
    const { id } = req.params;
    const row = await BlogRepository.findById(id);
    if (!row) throw new AppError('Không tìm thấy bài', 404);

    const {
      title,
      excerpt,
      content,
      image_url,
      category,
      is_published,
      slug: slugIn,
      status,
      rejection_reason,
      is_flagged,
      is_featured,
      scheduled_at,
    } = req.body;
    let resolvedCategoryId = undefined;
    if (category) {
      resolvedCategoryId = await getOrCreateCategory(category);
    }
    const updates = {
      title,
      excerpt,
      content,
      image_url,
      category_id: resolvedCategoryId,
      status,
      rejection_reason,
      is_flagged,
      is_featured,
      scheduled_at,
    };
    if (slugIn !== undefined) {
      const base = slugify(slugIn);
      updates.slug = await ensureUniqueSlug(base, Number(id));
    }
    if (is_published !== undefined) {
      updates.is_published = Boolean(is_published);
      if (updates.is_published) {
        if (!row.published_at) updates.published_at = new Date();
        updates.status = 'published';
      } else {
        updates.published_at = null;
        updates.status = 'draft';
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
      return ApiResponse.forbidden(res, 'Bạn không có quyền tạo bài viết cho công ty');
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
      return ApiResponse.forbidden(res, 'Bạn không có quyền cập nhật bài viết cho công ty');
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
      return ApiResponse.forbidden(res, 'Bạn không có quyền xóa bài viết cho công ty');
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
        userAgent: req.get('user-agent'),
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
            data: { blog_id: id },
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
      return ApiResponse.forbidden(res, 'Bạn cần quyền quản trị nội dung để xóa hàng loạt');
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
