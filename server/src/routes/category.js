/**
 * Category Routes — public endpoints for categories.
 */
const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/category');

router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getCategory);

module.exports = router;
