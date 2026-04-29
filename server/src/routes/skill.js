/**
 * Skill Routes — public list and admin CRUD.
 */
const express = require('express');
const router = express.Router();
const SkillRepository = require('../models/Skill');
const { protect, authorize } = require('../middlewares/auth');
const { ApiResponse } = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

// GET /api/skills — public, list all skills (with optional search)
router.get('/', catchAsync(async (req, res) => {
  const { search } = req.query;
  const skills = await SkillRepository.findAll({ search, includeInactive: false });
  return ApiResponse.success(res, skills);
}));

// POST /api/skills/admin — admin create
router.post('/admin', protect, authorize('admin'), catchAsync(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return ApiResponse.error(res, 400, 'Skill name is required');
  }
  const skill = await SkillRepository.createManaged(req.body);
  return ApiResponse.created(res, skill);
}));

// PUT /api/skills/admin/:id — admin update
router.put('/admin/:id', protect, authorize('admin'), catchAsync(async (req, res) => {
  const { id } = req.params;
  const existing = await SkillRepository.findById(id, { includeInactive: true });
  if (!existing) {
    return ApiResponse.notFound(res, 'Skill');
  }
  const skill = await SkillRepository.updateManaged(id, req.body);
  return ApiResponse.success(res, skill);
}));

// DELETE /api/skills/admin/:id — admin delete
router.delete('/admin/:id', protect, authorize('admin'), catchAsync(async (req, res) => {
  const { id } = req.params;
  await SkillRepository.delete(id);
  return ApiResponse.noContent(res);
}));

module.exports = router;
