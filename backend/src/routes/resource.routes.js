const express = require('express');
const ResourceController = require('../controllers/resource.controller');
const authenticateJWT = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/rbac.middleware');

const router = express.Router();

// Public / Authenticated Routes
router.get('/types', authenticateJWT, ResourceController.getTypes);
router.get('/', authenticateJWT, ResourceController.getAll);
router.get('/:id', authenticateJWT, ResourceController.getById);

// Admin Protected Routes
router.post('/', authenticateJWT, authorizeRoles('ADMIN'), ResourceController.create);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN'), ResourceController.update);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), ResourceController.delete);

module.exports = router;
