const express = require('express');
const router = express.Router();
const queryController = require('../../controllers/geminiController/geminiController');

router.post('/summary', queryController.generateInvoiceNoteSummary);

module.exports = router;
