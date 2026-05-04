const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const HomepageContent = require('../models/HomepageContent');
const { protect, isAdmin } = require('../middlewares/auth');

// ========== ADMIN ROUTES (auth required) ==========

// Apply admin auth to all routes
router.use(protect, isAdmin);

/**
 * GET /admin/homepage
 * Get all homepage content for admin (including inactive)
 */
router.get('/', async (req, res) => {
  try {
    const data = await HomepageContent.getFullHomepageData();
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching admin homepage content:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải nội dung' });
  }
});

/**
 * GET /admin/homepage/sections
 * Get all sections (admin view)
 */
router.get('/sections', async (req, res) => {
  try {
    const sections = await HomepageContent.getAllSectionsAdmin();
    res.json({ success: true, data: sections });
  } catch (error) {
    logger.error('Error fetching sections:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải sections' });
  }
});

/**
 * PUT /admin/homepage/sections/:sectionKey
 * Update section settings
 */
router.put('/sections/:sectionKey', async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const { title, subtitle, is_active, display_order, metadata } = req.body;

    const success = await HomepageContent.updateSection(sectionKey, {
      title,
      subtitle,
      is_active,
      display_order,
      metadata,
    });

    if (success) {
      res.json({ success: true, message: 'Đã cập nhật section' });
    } else {
      res.status(404).json({ success: false, message: 'Section không tồn tại' });
    }
  } catch (error) {
    logger.error('Error updating section:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật' });
  }
});

/**
 * POST /admin/homepage/sections
 * Create new section
 */
router.post('/sections', async (req, res) => {
  try {
    const { section_key, section_type, title, subtitle, is_active, display_order, metadata } =
      req.body;

    if (!section_key || !section_type) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const id = await HomepageContent.createSection({
      section_key,
      section_type,
      title,
      subtitle,
      is_active,
      display_order,
      metadata,
    });

    res.json({ success: true, message: 'Đã tạo section', data: { id } });
  } catch (error) {
    logger.error('Error creating section:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo section' });
  }
});

// ========== STATS CRUD ==========

/**
 * POST /admin/homepage/stats/:sectionId
 * Add new stat
 */
router.post('/stats/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { icon, display_value, label, value_type, display_order } = req.body;

    if (!display_value || !label) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const id = await HomepageContent.addStat(parseInt(sectionId), {
      icon,
      display_value,
      label,
      value_type,
      display_order,
    });

    res.json({ success: true, message: 'Đã thêm thống kê', data: { id } });
  } catch (error) {
    logger.error('Error adding stat:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi thêm thống kê' });
  }
});

/**
 * PUT /admin/homepage/stats/:statId
 * Update stat
 */
router.put('/stats/:statId', async (req, res) => {
  try {
    const { statId } = req.params;
    const success = await HomepageContent.updateStat(parseInt(statId), req.body);

    if (success) {
      res.json({ success: true, message: 'Đã cập nhật thống kê' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy thống kê' });
    }
  } catch (error) {
    logger.error('Error updating stat:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật' });
  }
});

/**
 * DELETE /admin/homepage/stats/:statId
 * Delete stat
 */
router.delete('/stats/:statId', async (req, res) => {
  try {
    const { statId } = req.params;
    const success = await HomepageContent.deleteStat(parseInt(statId));

    if (success) {
      res.json({ success: true, message: 'Đã xóa thống kê' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy thống kê' });
    }
  } catch (error) {
    logger.error('Error deleting stat:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa' });
  }
});

// ========== TESTIMONIALS CRUD ==========

/**
 * POST /admin/homepage/testimonials/:sectionId
 * Add new testimonial
 */
router.post('/testimonials/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { author_name, author_role, author_avatar, content, rating, display_order } = req.body;

    if (!author_name || !content) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const id = await HomepageContent.addTestimonial(parseInt(sectionId), {
      author_name,
      author_role,
      author_avatar,
      content,
      rating,
      display_order,
    });

    res.json({ success: true, message: 'Đã thêm đánh giá', data: { id } });
  } catch (error) {
    logger.error('Error adding testimonial:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi thêm đánh giá' });
  }
});

/**
 * PUT /admin/homepage/testimonials/:testimonialId
 * Update testimonial
 */
router.put('/testimonials/:testimonialId', async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const success = await HomepageContent.updateTestimonial(parseInt(testimonialId), req.body);

    if (success) {
      res.json({ success: true, message: 'Đã cập nhật đánh giá' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }
  } catch (error) {
    logger.error('Error updating testimonial:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật' });
  }
});

/**
 * DELETE /admin/homepage/testimonials/:testimonialId
 * Delete testimonial
 */
router.delete('/testimonials/:testimonialId', async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const success = await HomepageContent.deleteTestimonial(parseInt(testimonialId));

    if (success) {
      res.json({ success: true, message: 'Đã xóa đánh giá' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }
  } catch (error) {
    logger.error('Error deleting testimonial:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa' });
  }
});

// ========== PARTNERS CRUD ==========

/**
 * POST /admin/homepage/partners/:sectionId
 * Add new partner
 */
router.post('/partners/:sectionId', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { name, logo_url, logo_svg, website_url, display_order } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Thiếu tên đối tác' });
    }

    const id = await HomepageContent.addPartner(parseInt(sectionId), {
      name,
      logo_url,
      logo_svg,
      website_url,
      display_order,
    });

    res.json({ success: true, message: 'Đã thêm đối tác', data: { id } });
  } catch (error) {
    logger.error('Error adding partner:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi thêm đối tác' });
  }
});

/**
 * PUT /admin/homepage/partners/:partnerId
 * Update partner
 */
router.put('/partners/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const success = await HomepageContent.updatePartner(parseInt(partnerId), req.body);

    if (success) {
      res.json({ success: true, message: 'Đã cập nhật đối tác' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy đối tác' });
    }
  } catch (error) {
    logger.error('Error updating partner:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật' });
  }
});

/**
 * DELETE /admin/homepage/partners/:partnerId
 * Delete partner
 */
router.delete('/partners/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const success = await HomepageContent.deletePartner(parseInt(partnerId));

    if (success) {
      res.json({ success: true, message: 'Đã xóa đối tác' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy đối tác' });
    }
  } catch (error) {
    logger.error('Error deleting partner:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa' });
  }
});

module.exports = router;
