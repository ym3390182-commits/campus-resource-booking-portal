const express = require('express');
const DashboardController = require('../controllers/dashboard.controller');
const authenticateJWT = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticateJWT);

router.get('/stats', DashboardController.getStats);

module.exports = router;
