const express = require('express');
const router = express.Router();
const EmployerController = require('../controllers/employer');
const BlogController = require('../controllers/blog');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { verifyUploadSignature } = require('../middlewares/verify-upload-signature');

router.get('/profile', protect, authorize('employer'), EmployerController.getProfile);
router.get('/me', protect, authorize('employer'), EmployerController.getProfile);
router.put('/profile', protect, authorize('employer'), EmployerController.updateProfile);
router.put('/me', protect, authorize('employer'), EmployerController.updateProfile);
router.post(
  '/upload-logo',
  protect,
  authorize('employer'),
  upload.single('logo'),
  verifyUploadSignature,
  EmployerController.uploadLogo
);

router.get('/blog/posts', protect, authorize('employer'), BlogController.listEmployer);
router.post('/blog/posts', protect, authorize('employer'), BlogController.createEmployer);
router.put('/blog/posts/:id', protect, authorize('employer'), BlogController.updateEmployer);
router.delete('/blog/posts/:id', protect, authorize('employer'), BlogController.deleteEmployer);

module.exports = router;
