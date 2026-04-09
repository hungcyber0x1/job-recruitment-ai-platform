const express = require('express');
const PublicToolsController = require('../controllers/public-tools');
const { publicToolsLimiter, aiLimiter } = require('../middlewares/rate-limiter');
const upload = require('../middlewares/upload');
const { verifyUploadSignature } = require('../middlewares/verify-upload-signature');

const router = express.Router();

router.post(
  '/salary-estimate',
  publicToolsLimiter,
  PublicToolsController.salaryEstimate.bind(PublicToolsController)
);

router.post(
  '/cv-preview',
  aiLimiter,
  publicToolsLimiter,
  upload.single('resume'),
  verifyUploadSignature,
  PublicToolsController.cvPreview.bind(PublicToolsController)
);

module.exports = router;
