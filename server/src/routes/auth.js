const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth');
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rate-limiter');

const { registerValidator, loginValidator } = require('../validations/auth');
const { validate } = require('../middlewares/validation');
const oauthRoutes = require('./oauth');

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, first_name, last_name, role]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               role: { type: string, enum: [candidate, recruiter] }
 *     responses:
 *       201: { description: User created }
 *       400: { description: Invalid input }
 */
router.post('/register', authLimiter, registerValidator, validate, AuthController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, loginValidator, validate, AuthController.login);
router.post('/logout', AuthController.logout);
router.use('/oauth', oauthRoutes);
router.get('/me', protect, AuthController.getMe);
router.put('/password', protect, AuthController.updatePassword);
router.post('/oauth/unlink', protect, AuthController.unlinkOAuth);

module.exports = router;
