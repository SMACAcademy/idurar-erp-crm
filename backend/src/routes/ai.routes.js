const express = require('express');
const router = express.Router();
const validateToken = require('../middleware/validateToken');
const aiController = require('../controllers/ai.controller');

// Generate invoice summary
router.post('/invoice/summary', validateToken, aiController.generateInvoiceSummary);

module.exports = router;
