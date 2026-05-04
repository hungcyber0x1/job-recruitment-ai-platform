const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const HomepageContent = require('../models/HomepageContent');

const TRUSTED_BY_FALLBACK_SECTION = {
  id: null,
  section_key: 'trusted_by',
  section_type: 'logos',
  title: 'Được tin tưởng bởi',
  subtitle: null,
  is_active: 1,
  display_order: 0,
  metadata: { source: 'fallback' },
  items: [],
};

function sendTrustedByFallback(res) {
  return res.json({
    success: true,
    data: TRUSTED_BY_FALLBACK_SECTION,
  });
}

function isTrustedByKey(sectionKey) {
  return ['trusted_by', 'partners', 'logos'].includes(String(sectionKey || '').trim());
}

function isMissingHomepageTableError(error) {
  const message = String(error?.sqlMessage || error?.message || '');
  return (
    ['ER_NO_SUCH_TABLE', 'ER_BAD_TABLE_ERROR'].includes(error?.code) &&
    message.includes('homepage_')
  );
}

// ========== PUBLIC ROUTES (no auth needed) ==========

/**
 * GET /homepage
 * Get all homepage content (public)
 */
router.get('/partners', async (req, res) => {
  try {
    const section = await HomepageContent.getSectionByKey('trusted_by');

    if (!section) {
      return sendTrustedByFallback(res);
    }

    const items = await HomepageContent.getPartners(section.id);
    res.json({
      success: true,
      data: { ...section, items },
    });
  } catch (error) {
    if (isMissingHomepageTableError(error)) {
      logger.warn('Homepage content tables are missing, using fallback partners:', error.message);
      return sendTrustedByFallback(res);
    }

    logger.error('Error fetching homepage partners:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải đối tác' });
  }
});

router.get('/', async (req, res) => {
  try {
    const data = await HomepageContent.getFullHomepageData();
    res.json({ success: true, data });
  } catch (error) {
    if (isMissingHomepageTableError(error)) {
      logger.warn(
        'Homepage content tables are missing, using fallback homepage content:',
        error.message
      );
      return res.json({ success: true, data: { trusted_by: TRUSTED_BY_FALLBACK_SECTION } });
    }

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
      if (isTrustedByKey(sectionKey)) {
        return sendTrustedByFallback(res);
      }

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
      data: { ...section, items },
    });
  } catch (error) {
    if (isMissingHomepageTableError(error) && isTrustedByKey(req.params.sectionKey)) {
      logger.warn('Homepage content tables are missing, using fallback section:', error.message);
      return sendTrustedByFallback(res);
    }

    logger.error('Error fetching homepage section:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải section' });
  }
});

module.exports = router;
