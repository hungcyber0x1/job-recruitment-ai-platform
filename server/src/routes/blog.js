const express = require('express');
const router = express.Router();
const BlogController = require('../controllers/blog');

router.get('/posts', BlogController.listPublic);
router.get('/posts/:slug', BlogController.getPublicBySlug);

module.exports = router;
