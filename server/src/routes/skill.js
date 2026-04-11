const express = require('express');
const router = express.Router();
const SkillRepository = require('../models/Skill');
const { protect, authorize } = require('../middlewares/auth');

// GET /api/skills — public, list all skills (with optional search)
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    let skills;
    if (search) {
      const { pool } = require('../config/database.config');
      const [rows] = await pool.query('SELECT * FROM skills WHERE name LIKE ? ORDER BY name ASC', [
        `%${search}%`,
      ]);
      skills = rows;
    } else {
      skills = await SkillRepository.findAll();
    }
    res.json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/skills — admin create
router.post('/admin', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, category } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Skill name is required' });
    }
    const id = await SkillRepository.create({ name, category: category || null });
    const skill = await SkillRepository.findById(id);
    res.status(201).json({ success: true, data: skill });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/skills/:id — admin update
router.put('/admin/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await SkillRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    const skill = await SkillRepository.update(id, req.body);
    res.json({ success: true, data: skill });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/skills/:id — admin delete
router.delete('/admin/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await SkillRepository.delete(id);
    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
