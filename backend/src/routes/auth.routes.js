const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Auth routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
