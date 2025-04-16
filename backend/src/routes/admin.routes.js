const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const adminAuth = require('../controllers/coreControllers/adminAuth');

// Admin routes
router.get('/', adminAuth.isValidAuthToken, adminController.getAll);
router.get('/:id', adminAuth.isValidAuthToken, adminController.getById);
router.post('/', adminAuth.isValidAuthToken, adminController.create);
router.put('/:id', adminAuth.isValidAuthToken, adminController.update);
router.delete('/:id', adminAuth.isValidAuthToken, adminController.delete);

module.exports = router;
