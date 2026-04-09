const express = require('express');
const oauthController = require('../controllers/oauthController');

const router = express.Router();

router.get('/status', oauthController.oauthStatus);
router.get('/:provider/callback', oauthController.oauthCallback);
router.get('/:provider', oauthController.startOAuth);

module.exports = router;
