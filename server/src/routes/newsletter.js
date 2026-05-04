const express = require('express');
const NewsletterController = require('../controllers/newsletter');
const { newsletterLimiter } = require('../middlewares/rate-limiter');

const router = express.Router();

router.post('/subscribe', newsletterLimiter, NewsletterController.subscribe);

module.exports = router;
