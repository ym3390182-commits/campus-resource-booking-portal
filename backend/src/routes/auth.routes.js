const express = require('express');
const AuthController = require('../controllers/auth.controller');
const authenticateJWT = require('../middlewares/auth.middleware');

const router = express.Router();

// Public Routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected Routes
router.get('/me', authenticateJWT, AuthController.getMe);

module.exports = router;
