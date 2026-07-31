const express = require('express');
const ApprovalController = require('../controllers/approval.controller');
const authenticateJWT = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/rbac.middleware');

const router = express.Router();

// All approval management endpoints require ADMIN role authorization
router.use(authenticateJWT);
router.use(authorizeRoles('ADMIN'));

router.get('/pending', ApprovalController.getPending);
router.patch('/:id/action', ApprovalController.processAction);

module.exports = router;
