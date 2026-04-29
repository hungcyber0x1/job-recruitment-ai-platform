const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const HomepageContent = require('../models/HomepageContent');

// ========== PUBLIC ROUTES (no auth needed) ==========

/**
 * GET /homepage
 * Get all homepage content (public)
 */
router.get('/', async (req, res) => {
  try {
    const data = await HomepageContent.getFullHomepageData();
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching homepage content:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải nội dung homepage' });
  }
});

/**
 * GET /homepage/:sectionKey
 * Get specific section (public)
 */
router.get('/:sectionKey', async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const section = await HomepageContent.getSectionByKey(sectionKey);
    
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    let items = [];
    switch (section.section_type) {
      case 'stats':
        items = await HomepageContent.getStats(section.id);
        break;
      case 'testimonials':
        items = await HomepageContent.getTestimonials(section.id);
        break;
      case 'logos':
      case 'partners':
        items = await HomepageContent.getPartners(section.id);
        break;
    }

    res.json({
      success: true,
      data: { ...section, items }
    });
  } catch (error) {
    logger.error('Error fetching homepage section:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải section' });
  }
});

module.exports = router;
