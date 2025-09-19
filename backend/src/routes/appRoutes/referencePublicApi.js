const express = require('express');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');

// Public "get all" endpoints (no auth) for reference tables

// Payment Modes - list all
if (appControllers.paymentModeController?.listAll) {
  router.get('/paymentMode/list/all', appControllers.paymentModeController.listAll);
}

// Taxes - list all
if (appControllers.taxesController?.listAll) {
  router.get('/taxes/list/all', appControllers.taxesController.listAll);
}

module.exports = router;