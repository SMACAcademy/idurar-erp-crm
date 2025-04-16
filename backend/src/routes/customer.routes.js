const express = require('express');
const customerController = require('../controllers/customer.controller');
const { validateToken } = require('../middlewares/validateToken');

const router = express.Router();

// Apply validateToken middleware to all customer routes
router.use(validateToken);

// List endpoint (for dropdown)
router.get('/list', customerController.getMany);

// CRUD routes
router.get('/', customerController.getMany);
router.get('/:id', customerController.getOne);
router.post('/', customerController.createOne);
router.put('/:id', customerController.updateOne);
router.delete('/:id', customerController.removeOne);

module.exports = router;
