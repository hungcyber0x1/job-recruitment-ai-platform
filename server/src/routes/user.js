const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { verifyUploadSignature } = require('../middlewares/verify-upload-signature');

const { updateUserValidator } = require('../validations/user');
const { validate } = require('../middlewares/validation');

router.get('/profile', protect, UserController.getProfile);
router.get('/all', protect, authorize('admin'), UserController.getAllUsers);
router.put('/profile', protect, updateUserValidator, validate, UserController.update);
router.put('/preferences', protect, UserController.updatePreferences);
router.post(
  '/upload-avatar',
  protect,
  upload.single('avatar'),
  verifyUploadSignature,
  UserController.uploadAvatar
);

module.exports = router;
