const BlogRepository = require('../models/Blog');
const EmployerRepository = require('../models/Employer');
const AppError = require('../utils/errorHandler');

/** Slug bài viết: chỉ [a-z0-9], tối đa 100 ký tự, mặc định `bai-viet` — cố ý khác `utils/stringHelper.slugify` (giữ ký tự `_`). */
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
  async listPublic(req, res, next) {
    try {
      const { category, search, sort = 'newest' } = req.query;
      const posts = await BlogRepository.findPublished({ category, search, sort });
      const mapped = posts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        image: p.image_url,
        author: p.author_name?.trim() || 'HireAI',
        authorType: p.author_type,
        companyName: p.company_name || null,
        date: formatDateShortVi(p),
        category: p.category,
        viewCount: typeof p.view_count === 'number' ? p.view_count : 0,
        publishedAt: toIsoDate(p),
      }));
      res.json({ success: true, data: mapped });
    } catch (e) {
      next(e);
    }
  }

  async getPublicBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const post = await BlogRepository.findBySlugForPublic(slug);
      if (!post) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
      }
      const prevViews = typeof post.view_count === 'number' ? post.view_count : 0;
      await BlogRepository.incrementViewCount(post.id);
      const avatar =
        post.author_avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name || 'A')}&background=0D8ABC&color=fff`;
      res.json({
        success: true,
        data: {
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          image: post.image_url,
          author: post.author_name?.trim() || 'HireAI',
          authorType: post.author_type,
          companyName: post.company_name || null,
          date: formatDateLongVi(post),
          publishedAt: toIsoDate(post),
          category: post.category,
          viewCount: prevViews + 1,
          avatar,
        },
      });
    } catch (e) {
      next(e);
    }
  }

  async listAdmin(req, res, next) {
    try {
      const { search, author_type: authorTypeIn } = req.query;
      const authorType =
        authorTypeIn === 'admin' || authorTypeIn === 'employer' ? authorTypeIn : undefined;

      const rawPage = Number.parseInt(String(req.query.page || '1'), 10);
      const rawSize = Number.parseInt(String(req.query.page_size || req.query.limit || '20'), 10);
      const pageSize = Math.min(
        100,
        Math.max(5, Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 20)
      );

      const total = await BlogRepository.countAllAdmin({ search, authorType });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      let page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
      if (page > totalPages) page = totalPages;
      const offset = (page - 1) * pageSize;
      const posts = await BlogRepository.findAllAdmin({
        search,
        authorType,
        limit: pageSize,
        offset,
      });
      res.json({
        success: true,
        data: posts,
        meta: {
          total,
          page,
          pageSize,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (e) {
      next(e);
    }
  }

  async createAdmin(req, res, next) {
    try {
      const { title, excerpt, content, image_url, category, is_published, slug: slugIn } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, message: 'Tiêu đề là bắt buộc' });
      }
      const base = slugIn ? slugify(slugIn) : slugify(title);
      const slug = await ensureUniqueSlug(base);
      const pub = Boolean(is_published);
      const published_at = pub ? new Date() : null;
      const id = await BlogRepository.create({
        slug,
        title,
        excerpt,
        content,
        image_url,
        category: category || 'Technology',
        author_type: 'admin',
        author_user_id: req.user.id,
        employer_id: null,
        is_published: pub,
        published_at,
      });
      const created = await BlogRepository.findById(id);
      res.status(201).json({ success: true, data: created });
    } catch (e) {
      next(e);
    }
  }

  async updateAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const row = await BlogRepository.findById(id);
      if (!row) throw new AppError('Không tìm thấy bài', 404);

      const { title, excerpt, content, image_url, category, is_published, slug: slugIn } = req.body;
      const updates = { title, excerpt, content, image_url, category };
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
      res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  }

  async deleteAdmin(req, res, next) {
    try {
      const { id } = req.params;
      await BlogRepository.delete(Number(id));
      res.json({ success: true, message: 'Đã xóa' });
    } catch (e) {
      next(e);
    }
  }

  async listEmployer(req, res, next) {
    try {
      const employer = await EmployerRepository.findByUserId(req.user.id);
      if (!employer) {
        return res
          .status(403)
          .json({ success: false, message: 'Không tìm thấy hồ sơ nhà tuyển dụng' });
      }
      const posts = await BlogRepository.findByEmployer(employer.id, { limit: 100, offset: 0 });
      res.json({ success: true, data: posts });
    } catch (e) {
      next(e);
    }
  }

  async createEmployer(req, res, next) {
    try {
      const employer = await EmployerRepository.findByUserId(req.user.id);
      if (!employer) {
        return res
          .status(403)
          .json({ success: false, message: 'Không tìm thấy hồ sơ nhà tuyển dụng' });
      }
      const { title, excerpt, content, image_url, category, is_published, slug: slugIn } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, message: 'Tiêu đề là bắt buộc' });
      }
      const base = slugIn ? slugify(slugIn) : slugify(title);
      const slug = await ensureUniqueSlug(base);
      const pub = Boolean(is_published);
      const published_at = pub ? new Date() : null;
      const id = await BlogRepository.create({
        slug,
        title,
        excerpt,
        content,
        image_url,
        category: category || 'Career Tips',
        author_type: 'employer',
        author_user_id: req.user.id,
        employer_id: employer.id,
        is_published: pub,
        published_at,
      });
      const created = await BlogRepository.findById(id);
      res.status(201).json({ success: true, data: created });
    } catch (e) {
      next(e);
    }
  }

  async updateEmployer(req, res, next) {
    try {
      const employer = await EmployerRepository.findByUserId(req.user.id);
      if (!employer) {
        return res
          .status(403)
          .json({ success: false, message: 'Không tìm thấy hồ sơ nhà tuyển dụng' });
      }
      const { id } = req.params;
      const row = await BlogRepository.findById(id);
      if (!row || row.employer_id !== employer.id) {
        throw new AppError('Không tìm thấy bài hoặc không có quyền', 403);
      }
      const { title, excerpt, content, image_url, category, is_published, slug: slugIn } = req.body;
      const updates = { title, excerpt, content, image_url, category };
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
      res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  }

  async deleteEmployer(req, res, next) {
    try {
      const employer = await EmployerRepository.findByUserId(req.user.id);
      if (!employer) {
        return res
          .status(403)
          .json({ success: false, message: 'Không tìm thấy hồ sơ nhà tuyển dụng' });
      }
      const { id } = req.params;
      const row = await BlogRepository.findById(id);
      if (!row || row.employer_id !== employer.id) {
        throw new AppError('Không tìm thấy bài hoặc không có quyền', 403);
      }
      await BlogRepository.delete(Number(id));
      res.json({ success: true, message: 'Đã xóa' });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new BlogController();
